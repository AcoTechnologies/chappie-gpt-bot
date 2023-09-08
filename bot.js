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

class ChatEntry {
    constructor(author, content) {
        this.author = author;
        this.content = content;
    }
}

class ChatHistory {
    constructor() {
        this.promt_start = presets.initial;
        this.current_mood = "default";
        this.history = [];
    }

    addEntry(author, content) {
        if (this.history.length > 6) {
            this.history.shift();
        }
        this.history.push(new ChatEntry(author, content));
    }

    getPrompt() {
        var prompt = this.promt_start;
        this.history.forEach(entry => {
            prompt += "\n\nAuthor(" + entry.author + "): " + "\nBEGIN\n" + entry.content + "\nEND";
            // if last entry
            if (this.history[this.history.length - 1] == entry) {
                prompt += "\nAuthor(Chappie): " + "\nBEGIN\n";
            }
        });
        return prompt;
    }
    changePreset(mood) {
        try {
            this.promt_start = presets[mood];
            this.current_mood = mood;
        }
        catch (err) {
            this.promt_start = presets.default;
            this.current_mood = "default";
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
        var prompt = session.history.getPrompt();
        openai.openaiRequest(openai_config.model, "completion", { "prompt": prompt }, function (response) {
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
                var bot_response = json.choices[0].text;
                // if the text contains the stop criterias from openai.json then remove that from the response and all text after the stop criteria
                if (bot_response.includes(openai_config.stop)) {
                    bot_response = bot_response.substring(0, bot_response.indexOf(openai_config.stop));
                }
                // send the bot response
                message.channel.send(bot_response);
            } catch (e) {
                console.log(e);
            }
        });
    }

});

console.log("Starting bot...");

client.login(auth.token);