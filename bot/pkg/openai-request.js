var config = require('../config/config.json');
var logging = require('./logger.js');
var XMLHttpRequest = require('xhr2');


function requestHandler(msg_event, response, Http_completion) {
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
            msg_event.reply("Chappie is currently overloaded with other requests. Please try again later.");
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
            msg_event.reply(bot_response);
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
                        msg_event.reply(reduces_response);
                        reduces_response = "";
                        characters_in_message = 0;
                    }
                    reduces_response += line + "\n";
                    characters_in_message += line.length;
                });
                msg_event.reply(reduces_response);
            } else {
                logging.logger.error(e);
            }
        }
    } catch (e) {
        console.log(e);
    }
}

// Make a request to the OpenAI API
function chat(msg_event, model, bot_context) {
    logging.logger.debug(bot_context);
    var model_name = "None";
    var avail_models = config.openai.models;
    if (!avail_models[model]) {
        throw "Invalid model: " + model;
    }
    else {
        var data = {};
        model_name = avail_models[model];
        data.model = model_name;
        data.messages = bot_context;
        logging.logger.info("url: " + config.openai.url);

        const Http_completion = new XMLHttpRequest();
        Http_completion.open("POST", config.openai.url);
        Http_completion.setRequestHeader("Content-Type", "application/json");
        Http_completion.setRequestHeader("Authorization", "Bearer " + config.openai.api_key);
        Http_completion.send(JSON.stringify(data));
        Http_completion.onreadystatechange = (e) => {
            if (Http_completion.readyState == 4) {
                const response = Http_completion.responseText;
                requestHandler(msg_event, response, Http_completion);
            }
        }
        return Http_completion;
    }
}

module.exports = { chat };