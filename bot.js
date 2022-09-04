const { Client, GatewayIntentBits } = require('discord.js');
var logger = require('winston');
var auth = require('./auth.json');
var openai = require('./openai-request.js');

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

// Initialize Discord Bot
var bot = new Discord.Client({
    token: auth.token,
    autorun: true
});

bot.on('ready', function (evt) {
    logger.info('Connected');
    logger.info('Logged in as: ');
    logger.info(bot.username + ' - (' + bot.id + ')');
});

bot.on('message', function (user, userID, channelID, message, event) {
    // print input messag, user and channel
    logger.info("User: " + user + " UserID: " + userID + " ChannelID: " + channelID + " Message: " + message);
    if (message === "Chader, are you there?") {
        if (ai_enabled) {
            bot.sendMessage({
                to: channelID,
                message: "Yes, i am here."
            });
        }
        else {
            bot.sendMessage({
                to: channelID,
                message: "I am not allowed to respond."
            });
        }
        return
    }
    if (message === "Chader, come back") {
        ai_enabled = true;
        bot.sendMessage({
            to: channelID,
            message: "I am back."
        });
        return
    }
    if (message === "Chader, fuck off") {
        ai_enabled = false;
        bot.sendMessage({
            to: channelID,
            message: "I am going away."
        });
        return
    }
    if (ai_enabled) {
        console.log("user: " + user);
        var user_message = "\n\nUser(" + user + "): " + message
        var add_prompt = prompt + user_message + "\nChader: ";
        console.log("add_prompt: " + add_prompt);
        if (userID != bot.id) {
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
                    console.log(bot_response);
                    bot.sendMessage({
                        to: channelID,
                        message: bot_response
                    });
                }
                catch (e) {
                    console.log('Error parsing JSON!');
                }
            });
        }
    }
    else {
        console.log("AI is disabled");
        console.log(user + " | " + message);
    }
});