var logging = require('./pkg/logger.js');
var config = require('./config/config.json');
var presets = require('./config/bot-presets.json');
var phrases = require('./config/phrases.json');
var openai = require('./pkg/openai-request.js');
const { REST } = require('@discordjs/rest');
const { Client, GatewayIntentBits, SlashCommandBuilder, Routes } = require('discord.js');

// Configure logging.logger settings
logging.logger.level = 'debug';

logging.logger.info("Starting bot...");

bot_name = "Chappie";

class ChatEntry {
    constructor(author, content) {
        this.author = author;
        this.content = content;
    }
}

class ChatHistory {
    constructor() {
        this.bot_preset = presets.default;
        this.current_preset = "default";
        this.history = [];
    }

    addEntry(author, content) {
        if (this.history.length > 10) {
            this.history.shift();
        }
        this.history.push(new ChatEntry(author, content));
    }

    getLatestLog() {
        var bot_context = [];
        var bot_context_token_count = 0;
        // create a flipped copy of the history
        var history_flipped = this.history.slice().reverse();
        history_flipped.forEach(entry => {
            bot_context_token_count += entry.content.split(" ").length;
            if (bot_context_token_count > 2400) { // max token count is 4096, and it should be less than that
                this.bot_preset.forEach(prefixEntry => {
                    bot_context.unshift({
                        "role": prefixEntry.role,
                        "content": prefixEntry.content
                    });
                });
                return bot_context;
            }
            if (entry.author == bot_name) {
                bot_context.unshift({
                    "role": "assistant",
                    "content": entry.content
                });
            } else {
                // put the entry at the start of the array
                bot_context.unshift({
                    "role": "user",
                    "content": entry.author + ": " + entry.content
                });
                /*
                bot_context.push({
                    "role": "user",
                    "content": entry.author + ": " + entry.content
                });
                */
            }
        });
        this.bot_preset.forEach(prefixEntry => {
            bot_context.unshift({
                "role": prefixEntry.role,
                "content": prefixEntry.content
            });
        });
        return bot_context;
    }
    changePreset(newPreset) {
        try {
            this.bot_preset = presets[newPreset];
            if (this.bot_preset == undefined) {

                this.bot_preset = presets.default;
                this.current_preset = "default";
            }
            this.current_preset = newPreset;
        }
        catch (err) {
            this.promt_start = presets.default;
            this.current_preset = "default";
        }
    }
}

class ChatSession {
    constructor(channelId, active) {
        this.channelId = channelId;
        this.active = active;
        this.history = new ChatHistory();
    }
}

function scanForKeyword(message, keyword) {
    if (message.toLowerCase().includes(keyword)) {
        return true;
    } else {
        return false;
    }
}

var sessions = [];

// whitelisted users
const whitelisted_ids = config.auth.whitelisted_ids;

const priviledged_user_ids = config.auth.priviledged_ids;

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
    logging.logger.debug(interaction);
    // check if user is priviledged
    priviledged = false;
    if (priviledged_user_ids.includes(interaction.user.id)) {
        priviledged = true;
    }
    logging.logger.info("Priviledged: " + priviledged);
    if (!interaction.isChatInputCommand() && !ai_enabled) {
        logging.logger.info("Not a chat input command");
        return;
    }
    // none-priviledged commands
    else if (interaction.commandName === 'ping') {
        logging.logger.info("Pong!");
        await interaction.reply('Pong!');
        return;
    }
    else if (interaction.commandName === 'model') {
        logging.logger.info("Model command");
        await interaction.reply('Model: ' + config.openai.model);
        return;
    }
    else if (priviledged) { // priviledged user commands
        if (interaction.commandName === 'enable') {
            logging.logger.info("Enabling AI");
            ai_enabled = true;
            // search for session
            var session = sessions.find(session => session.channelId == interaction.channelId);
            // if session does not exist, create it
            if (session == undefined) {
                sessions.push(new ChatSession(interaction.channelId, true));
            }
            // if session exists, set it to active
            else {
                session.active = true;
            }
            await interaction.reply(phrases.power.on[Math.floor(Math.random() * phrases.power.on.length) | 0]);
            return;
        }
        else if (interaction.commandName === 'disable') {
            logging.logger.info("Disabling AI");
            ai_enabled = false;
            // search for session
            var session = sessions.find(session => session.channelId == interaction.channelId);
            // if session does not exist, create it
            if (session == undefined) {
                sessions.push(new ChatSession(interaction.channelId, false));
            }
            // if session exists, set active to false
            else {
                session.active = false;
            }
            await interaction.reply(phrases.power.off[Math.floor(Math.random() * phrases.power.off.length) | 0]);
            return;
        }

        // command to change mode
        else if (interaction.commandName === 'setmode') {
            // this will set the AI's preset
            logging.logger.info("Setting mode");
            // get the preset from the interaction
            var preset = interaction.options.getString('mode');
            // search for session
            var session = sessions.find(session => session.channelId == interaction.channelId);
            // if session does not exist, create it
            if (session == undefined) {
                session = new ChatSession(interaction.channelId);
                sessions.push(session);
            }
            // change the preset
            session.history.changePreset(preset);
            // reply with the preset
            await interaction.reply("Set mode to " + session.history.current_preset);
            return;

        }

    }
    else {
        if (!priviledged) {
            logging.logger.info("Not a priviledged user");
            await interaction.reply('BIOS error: Access denied!');
            return;
        }
        else {
            logging.logger.info("Not a valid command");
            await interaction.reply('ERROR: INPUT UNRECOGNIZED!');
            return;
        }
    }
});



// create a on message event
client.on('messageCreate', message => {

    // Message content
    const content = message.content

    // Message author
    var author = message.author.global_name
    if (author == undefined) {
        author = message.author.username
    }
    // Message author id
    const author_id = message.author.id

    // if session does not exist, create it
    var session = sessions.find(session => session.channelId == message.channelId);
    if (session == undefined) {
        logging.logger.info("Session does not exist: " + session.channelId + ", creating it");
        sessions.push(new ChatSession(message.channelId, false));
    } else {
        logging.logger.debug("Session exists: " + session.channelId + ", active: " + session.active);
    }

    // if session is not active, return
    if (!session.active) {
        logging.logger.info("Session is not active: " + session.channelId + ", returning");
        return;
    } else {
        logging.logger.debug("Session is active: " + session.channelId + ", using it");
    }

    session.history.addEntry(author, content);

    var botMentioned = scanForKeyword(message.content, "chappie");

    if (!botMentioned) {
        logging.logger.info("false");
        return;
    } else {
        logging.logger.debug("true");
    }

    if (!ai_enabled) {
        logging.logger.info("AI is not enabled");
        return;
    } else {
        logging.logger.debug("AI is enabled");
    }


    // log content, user
    logging.logger.info("Message: " + content);
    logging.logger.info("Author: " + author);


    // Check if the message is from a whitelisted user
    if (whitelisted_ids.includes(author_id) && author_id != config.auth.client_id) {
        // Respond with ai response
        message.channel.sendTyping();
        var bot_context = session.history.getLatestLog();
        openai.openaiRequest(config.openai.model, bot_context, function (response, Http_completion) {
            if (Http_completion.status != 200) {
                logging.logger.error("Error: " + Http_completion.status);
                return;
            }
            try {
                logging.logger.info("Response: " + response);
                var json = JSON.parse(response);
                // if the response contains key message with value that contains 'overloaded'
                if (json['message'] && json['message'].includes(
                    'That model is currently overloaded with other requests.')) {
                    // stops sending typing indicator
                    message.reply("Chappie is currently overloaded with other requests. Please try again later.");
                    // log the error
                    logging.logger.error("Error: " + json['message']);
                    return;
                }
                var bot_response = json.choices[0].message.content;
                // send the bot response, within a try catch
                try {
                    // if the bot response is longer than 2000 characters, throw an error with code 50035
                    if (bot_response.length > 2000) {
                        throw { code: 50035, message: "Message too long" };
                    }
                    message.reply(bot_response);
                }
                catch (e) {
                    // if it is a discord api error, log it
                    // if it the error code is 50035, it is a message too long error
                    // so send the first 1500 characters of the response, and send the rest in another message, split by newlines
                    if (e.code == 50035) {
                        logging.logger.info("Message too long, splitting into multiple messages");
                        message_lines = bot_response.split("\n");
                        characters_in_message = 0;
                        reduces_response = "";
                        message_lines.forEach(line => {
                            if (characters_in_message > 1500) {
                                message.reply(reduces_response);
                                reduces_response = "";
                                characters_in_message = 0;
                            }
                            reduces_response += line + "\n";
                            characters_in_message += line.length;
                        });
                        message.reply(reduces_response);
                    } else {
                        logging.logger.error(e);
                    }
                }
            } catch (e) {
                console.log(e);
            }
        });
    }

});

client.login(config.auth.token);