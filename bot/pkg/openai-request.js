var config = require('../config/config.json');
var logger = require('winston');
var XMLHttpRequest = require('xhr2');

// configure logger settings if this is run directly
if (require.main === module) {
    logger.remove(logger.transports.Console);
    logger.add(new logger.transports.Console, {
        colorize: true
    });
    logger.level = 'debug';
}

// Make a request to the OpenAI API
function openaiRequest(model, bot_context, callback) {
    logger.debug(bot_context);
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
        logger.info("url: " + config.openai.url);

        const Http_completion = new XMLHttpRequest();
        Http_completion.open("POST", config.openai.url);
        Http_completion.setRequestHeader("Content-Type", "application/json");
        Http_completion.setRequestHeader("Authorization", "Bearer " + config.openai.api_key);
        Http_completion.send(JSON.stringify(data));
        Http_completion.onreadystatechange = (e) => {
            if (Http_completion.readyState == 4) {
                const response = Http_completion.responseText;
                callback(response, Http_completion);
            }
        }
        return Http_completion;
    }
}


// run a test request if this file is run directly
if (require.main === module) {
    openaiRequest("davinci", "completion", { "prompt": "Only say 'This is a test.'\n once.\n\n\n", "temperature": 0.5, "max_tokens": 10 }, function (response) {
        // log the response text
        logger.info(response);
        // parse the response text as JSON with try catch
        try {
            var json = JSON.parse(response);
            // log the completion
            console.log(json.choices[0].text);
        }
        catch (e) {
        }
    });
}

module.exports = { openaiRequest };