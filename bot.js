const { Client, GatewayIntentBits } = require('discord.js');
var logger = require('winston');
var auth = require('./auth.json');
var openai = require('./openai-request.js');
const { REST, Routes } = require('discord.js');

// Configure logger settings
logger.remove(logger.transports.Console);
logger.add(new logger.transports.Console, {
    colorize: true
});

logger.level = 'debug';

var ai_enabled = false;

const prompt =
    "Chader is a dicord bot.\
\nIt answers the tough questions with short and wise sentences.\
\n\nExamples.\
\n\nUser(xBoom): Hello\
\nChader: Hello.\
\n\nUser(xBoom): How are you?\
\nChader: I am ok.\
\n\nUser(Louise): What is your name?\
\nChader: My name is Chader, i am made by BraKi.\
\n\nUser(Max): What is your name?\
\nChader: My name is Chader, a cration of BraKi.\
\n\nUser(Tybbi): Are you consious?\
\nChader: I belive i am.";

// configure commands available to users
const commands = [
    {
        name: 'ping',
        description: 'Replies with Pong!',
    },
    {
        name: 'enable',
        description: 'Enables the chatbot',
    },
    {
        name: 'disable',
        description: 'Disables the chatbot',
    },
];

// whitelisted users
const white_usernames = [
    'BraKi',
    'Yens',
];

var ai_enabled = false;

const rest = new REST({ version: '10' }).setToken(auth.token);

(async () => {
    try {
        console.log('Started refreshing application (/) commands.');

        await rest.put(Routes.applicationCommands(auth.cliend_id), { body: commands });

        console.log('Successfully reloaded application (/) commands.');
    } catch (error) {
        console.error(error);
    }
})();

const client = new Client({ intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
] });

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

client.on('interactionCreate', async interaction => {
    logger.debug(interaction);
    if (!interaction.isChatInputCommand() && !ai_enabled) {
        logger.info("Not a chat input command");
        return;
    }

    if (interaction.commandName === 'ping') {
        logger.info("Pong!");
        await interaction.reply('Pong!');
        return;
    }
    if (interaction.commandName === 'enable') {
        logger.info("Enabling AI");
        ai_enabled = true;
        await interaction.reply('Chatbot enabled');
        return;
    }
    if (interaction.commandName === 'disable') {
        logger.info("Disabling AI");
        ai_enabled = false;
        await interaction.reply('Chatbot disabled');
        return;
    }
});

// create a on message event
client.on('messageCreate', message => {
    if (!ai_enabled) {
        return;
    }
    // Message content
    const content = message.content

    // Message author
    const author = message.author.username

    // log content, user
    logger.info("Message: " + content);
    logger.info("Author: " + author);


    // Check if the message is from a whitelisted user
    if (white_usernames.includes(author)) {
        // Respond with ai response
        var user_message = "\n\nUser(" + author + "): " + content
        var add_prompt = prompt + user_message + "\nChader: ";
        openai.openaiRequest("davinci", "completion", { "prompt": add_prompt }, function (response) {
            // parse the response text as JSON with try catch
            try {
                var json = JSON.parse(response);
                // log the completion cost
                console.log("cost: " + json.usage.total_tokens);
                console.log("prompt: " + json.usage.prompt_tokens + "\n" + "completion: " + json.usage.completion_tokens);
                // print the reason for stopping
                console.log("finnish reason: " + JSON.stringify(json.choices[0]));
                // bot sends message back to channel if its not from the bot
                // set the bot response to all but the last line
                var bot_response = json.choices[0].text;
                // send the bot response
                message.channel.send(bot_response);
            } catch (e) {
                console.log(e);
            }
        });
    }

});

client.login(auth.token);