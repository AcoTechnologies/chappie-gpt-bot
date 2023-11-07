var logging = require('./pkg/logger.js');
const { chatHandler } = require('./pkg/chat.js');
const { slashCommandHandler } = require('./pkg/commands.js');
const { Client, GatewayIntentBits } = require('discord.js');

// Configure logging.logger settings
logging.logger.level = 'debug';

logging.logger.info("Starting bot...");

const bot_name = "Chappie";
const bot_model = "gpt-3.5-turbo"

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildVoiceStates,
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