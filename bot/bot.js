var logger = require('winston');
var auth = require('./auth.json');
var presets = require('./bot-presets.json');
var phrases = require('./phrases.json');
var openai = require('./openai-request.js');
var openai_config = require('./openai.json');
const { REST } = require('@discordjs/rest');
const { Client, GatewayIntentBits, SlashCommandBuilder, Routes } = require('discord.js');

// Configure logger settings
logger.remove(logger.transports.Console);
logger.add(new logger.transports.Console, {
    colorize: true
});

logger.level = 'debug';

bot_name = "Chappie";

class ChatEntry {
    constructor(author, content) {
        this.author = author;
        this.content = content;
    }
}

class ChatHistory {
    constructor() {
        this.bot_context = presets.default;
        this.current_preset = "default";
        this.history = [];
    }

    addEntry(author, content) {
        if (this.history.length > 6) {
            this.history.shift();
        }
        this.history.push(new ChatEntry(author, content));
    }

    getLatestLog() {
        var bot_context = this.bot_context;
        this.history.forEach(entry => {
            if (entry.author == bot_name) {
                bot_context.push({
                    "role": "assistant",
                    "content": entry.content
                });
            } else {
                bot_context.push({
                    "role": "user",
                    "content": entry.author + ": " + entry.content
                });
            }
        }); //FIXME: when history builds up, this will get too long, resulting in to many tokens used in the request
        return bot_context;
    }
    changePreset(newPreset) {
        try {
            this.bot_context = presets[newPreset];
            this.current_preset = newPreset;
        }
        catch (err) {
            this.promt_start = presets.default;
            this.current_preset = "default";
        }
    }
}

class ChatSession {
    constructor(channelId) {
        this.channelId = channelId;
        this.history = new ChatHistory();
    }
}

var sessions = [];

// whitelisted users
const whitelisted_ids = auth.whitelisted_ids;

const priviledged_user_ids = auth.priviledged_ids;

var ai_enabled = false;


const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ]
});

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

client.on('interactionCreate', async interaction => {
    logger.debug(interaction);
    // check if user is priviledged
    priviledged = false;
    if (priviledged_user_ids.includes(interaction.user.id)) {
        priviledged = true;
    }
    logger.info("Priviledged: " + priviledged);
    if (!interaction.isChatInputCommand() && !ai_enabled) {
        logger.info("Not a chat input command");
        return;
    }
    // none-priviledged commands
    else if (interaction.commandName === 'ping') {
        logger.info("Pong!");
        await interaction.reply('Pong!');
        return;
    }
    else if (interaction.commandName === 'model') {
        logger.info("Model command");
        await interaction.reply('Model: ' + openai_config.model);
        return;
    }
    else if (priviledged) { // priviledged user commands
        if (interaction.commandName === 'enable') {
            logger.info("Enabling AI");
            ai_enabled = true;
            await interaction.reply(phrases.power.on[Math.floor(Math.random() * phrases.power.on.length) | 0]);
            return;
        }
        else if (interaction.commandName === 'disable') {
            logger.info("Disabling AI");
            ai_enabled = false;
            await interaction.reply(phrases.power.off[Math.floor(Math.random() * phrases.power.off.length) | 0]);
            return;
        }

        // command to change model
        else if (interaction.commandName === 'setmodel') {
            logger.info("Set model command");
            var new_model = interaction.options.getString('model');
            logger.info("New model: " + new_model);
            // model is in openai_config.models.keys()
            if (new_model in Object.keys(openai_config.models)) {
                openai_config.model = new_model;
                await interaction.reply('Model set to: ' + new_model);
            } else {
                await interaction.reply('Model not found');
            }
            return;
        }
    }
    else {
        if (!priviledged) {
            logger.info("Not a priviledged user");
            await interaction.reply('BIOS error: Access denied!');
            return;
        }
        else {
            logger.info("Not a valid command");
            await interaction.reply('ERROR: INPUT UNRECOGNIZED!');
            return;
        }
    }
});

// create a on message event
client.on('messageCreate', message => {
    if (!ai_enabled) {
        return;
    }

    // if session does not exist, create it
    var session = sessions.find(session => session.channelId == message.channelId);
    if (session == undefined) {
        session = new ChatSession(message.channelId);
        sessions.push(session);
    }

    // Message content
    const content = message.content

    // Message author
    const author = message.author.username

    // Message author id
    const author_id = message.author.id

    // Add message to history if it is not from the bot

    session.history.addEntry(author, content);

    // log content, user
    logger.info("Message: " + content);
    logger.info("Author: " + author);


    // Check if the message is from a whitelisted user
    if (whitelisted_ids.includes(author_id) && author_id != auth.client_id) {
        // Respond with ai response
        message.channel.sendTyping();
        var bot_context = session.history.getLatestLog();
        openai.openaiRequest(openai_config.model, bot_context, function (response) {
            // parse the response text as JSON with try catch
            try {
                logger.info("Response: " + response);
                var json = JSON.parse(response);
                // if the response contains key message with value that contains 'overloaded'
                if (json['message'] && json['message'].includes(
                    'That model is currently overloaded with other requests.')) {
                    // stops sending typing indicator
                    message.channel.send();
                    // log the error
                    logger.error("Error: " + json['message']);
                    return;
                }
                var bot_response = json.choices[0].message.content;
                // send the bot response, within a try catch
                try {
                    // if the bot response is longer than 2000 characters, throw an error with code 50035
                    if (bot_response.length > 2000) {
                        throw { code: 50035, message: "Message too long" };
                    }
                    message.channel.send(bot_response);
                }
                catch (e) {
                    // if it is a discord api error, log it
                    // if it the error code is 50035, it is a message too long error
                    // so send the first 1500 characters of the response, and send the rest in another message, split by newlines
                    if (e.code == 50035) {
                        logger.info("Message too long, splitting into multiple messages");
                        message_lines = bot_response.split("\n");
                        characters_in_message = 0;
                        reduces_response = "";
                        message_lines.forEach(line => {
                            if (characters_in_message > 1500) {
                                message.channel.send(reduces_response);
                                reduces_response = "";
                                characters_in_message = 0;
                            }
                            reduces_response += line + "\n";
                            characters_in_message += line.length;
                        });
                        message.channel.send(reduces_response);
                    } else {
                        logger.error(e);
                    }
                }
            } catch (e) {
                console.log(e);
            }
        });
    }

});

console.log("Starting bot...");

client.login(auth.token);