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
    constructor(channelId) {
        this.channelId = channelId;
        this.active = false;
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
            // search for session
            var session = sessions.find(session => session.channelId == interaction.channelId);
            // if session does not exist, create it
            if (session == undefined) {
                session = new ChatSession(interaction.channelId);
                session.active = true;
                sessions.push(session);
            }
            // if session exists, set it to active
            else {
                session.active = true;
            }
            await interaction.reply(phrases.power.on[Math.floor(Math.random() * phrases.power.on.length) | 0]);
            return;
        }
        else if (interaction.commandName === 'disable') {
            logger.info("Disabling AI");
            ai_enabled = false;
            // search for session
            var session = sessions.find(session => session.channelId == interaction.channelId);
            // if session does not exist, create it
            if (session == undefined) {
                session = new ChatSession(interaction.channelId);
                session.active = false;
                sessions.push(session);
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
            logger.info("Setting mode");
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

        //command to tell chappie something
        else if (interaction.commandName === 'tell') {//FIXME: this does not work because our message to Chappie isn't visible to us, and won't be stored in the history
            // Get the message from the interaction
            const message = interaction.options.getString('message');
    
            if (!ai_enabled) {
                logger.info("AI is not enabled");
                return;
            } else {
                logger.debug("AI is enabled");
            }
            
            // if session does not exist, create it
            var session = sessions.find(session => session.channelId == interaction.channelId);
            if (session == undefined) {
                logger.info("Session does not exist: " + session.channelId);
                session = new ChatSession(message.channelId);
                sessions.push(session);
            } else {
                logger.debug("Session exists: " + session.channelId);
            }
        
            // if session is not active, return
            if (!session.active) {
                logger.info("Session is not active: " + session.channelId);
                return;
            } else {
                logger.debug("Session is active: " + session.channelId);
            }
        
            // Message content
            const content = message
        
            // Message author
            const author = interaction.user.username
        
            // Message author id
            const author_id = interaction.user.id
        
            // Add message to history if it is not from the bot
        
            session.history.addEntry(author, content);
        
            // log content, user
            logger.info("Message: " + content);
            logger.info("Author: " + author);
        
        
            // Check if the message is from a whitelisted user
            if (whitelisted_ids.includes(author_id) && author_id != auth.client_id) {
                // Respond with ai response
                interaction.deferReply();
                var bot_context = session.history.getLatestLog();
                openai.openaiRequest(openai_config.model, bot_context, function (response, Http_completion) {
                    if (Http_completion.status != 200) {
                        logger.error("Error: " + Http_completion.status);
                        return;
                    }
                    try {
                        logger.info("Response: " + response);
                        var json = JSON.parse(response);
                        // if the response contains key message with value that contains 'overloaded'
                        if (json['message'] && json['message'].includes(
                            'That model is currently overloaded with other requests.')) {
                            // stops sending typing indicator
                            interaction.editReply("Chappie is currently overloaded with other requests. Please try again later.");
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
                            interaction.editReply(bot_response);
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
                                        interaction.editReply(reduces_response);
                                        reduces_response = "";
                                        characters_in_message = 0;
                                    }
                                    reduces_response += line + "\n";
                                    characters_in_message += line.length;
                                });
                                interaction.editReply(reduces_response);
                            } else {
                                logger.error(e);
                            }
                        }
                    } catch (e) {
                        console.log(e);
                    }
                });
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

// // create a on message event
// client.on('messageCreate', message => {
    

// });

console.log("Starting bot...");

client.login(auth.token);