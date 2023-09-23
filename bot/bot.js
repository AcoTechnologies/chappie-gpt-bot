var logging = require('./pkg/logger.js');
var presets = require('./config/bot-presets.json');
var phrases = require('./config/phrases.json');
var openai = require('./pkg/openai-request.js');
const { query } = require('./pkg/database/engine.js');
const { getSession, addSession } = require('./pkg/database/sessions.js');
const { getUser, addUser } = require('./pkg/database/users.js');
const { addMessage, getMessages } = require('./pkg/database/messages.js');
const { chatHandler } = require('./pkg/chat.js');
const { slashCommandHandler } = require('./pkg/commands.js');
const { REST } = require('@discordjs/rest');
const { Client, GatewayIntentBits, SlashCommandBuilder, Routes } = require('discord.js');

// Configure logging.logger settings
logging.logger.level = 'debug';

logging.logger.info("Starting bot...");

const bot_name = "Chappie";
const bot_model = "gpt-3.5-turbo"

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

    addEntry(author, content) { // This is deprecated, use addEntryToDB instead
        if (this.history.length > 10) {
            this.history.shift();
        }
        this.history.push(new ChatEntry(author, content));
    }

    // add entry to db
    async addEntryToDB(author, content, guild_session_id) {
        try {
            // insert the message into the database
            await query(`
                INSERT INTO chat_messages (author, content, channel_id)
                VALUES ('${author}', '${content}', '${guild_session_id}')`); // TODO: this should be encrypted with a secret key that expires every 24 hours
        } catch (error) {
            logging.logger.error('Error inserting chat message into db:', error);
        }
    }


    getLatestLog() { // This is deprecated, use getLatestLogsFromDB instead
        var bot_context = [];
        var bot_context_token_count = 0;
        // create a flipped copy of the history
        var history_flipped = this.history.slice().reverse();
        history_flipped.forEach(entry => {
            bot_context_token_count += entry.content.split(" ").length;
            if (bot_context_token_count > 2400) { // max token count is 4096, and it should be less than that
                const complete_context = this.bot_preset.concat(bot_context);
                return complete_context;
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
            }
        });

        // insert this.bot_preset at the start of the array, in the current order
        const complete_context = this.bot_preset.concat(bot_context);
        return complete_context;
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

var sessions = [];

// whitelisted users
const priviledged_user_ids = [process.env.DISCORD_OWNER_ID];

var ai_enabled = false;


const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ]
});

client.on('ready', () => {
    logging.logger.info(`Logged in as ${client.user.tag}!`);
});

client.on('interactionCreate', async interaction => slashCommandHandler(interaction));

// create a on message event to handle the general message event
client.on('messageCreate', msg_event => chatHandler(msg_event, bot_name, bot_model));

// login to Discord with your app's token, this starts the bot
client.login(process.env.DISCORD_TOKEN);