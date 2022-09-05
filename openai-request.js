var openai_config = require('./openai.json');
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
function openaiRequest(model, type, data, callback) {
    var model_name = "None";
    var types = Object.keys(openai_config.endpoints);
    if (!types.includes(type)) {
        throw "Invalid type: " + type;
    }
    var avail_models = openai_config.models;
    if (!avail_models[model]) {
        throw "Invalid model: " + model;
    }
    else {
        model_name = avail_models[model];
        var endpoint = openai_config.endpoints[type];
        var url = openai_config.url + endpoint;
        data.model = model_name;
        data.temperature = openai_config.temperature;
        data.top_p = openai_config.top_p;
        data.frequency_penalty = openai_config.frequency_penalty;
        data.presence_penalty = openai_config.presence_penalty;
        logger.info("url: " + url);
        logger.info("types: " + types);
        const Http_completion = new XMLHttpRequest();
        Http_completion.open("POST", url);
        Http_completion.setRequestHeader("Content-Type", "application/json");
        Http_completion.setRequestHeader("Authorization", "Bearer " + openai_config.api_key);
        Http_completion.send(JSON.stringify(data));
        Http_completion.onreadystatechange = (e) => {
            callback(Http_completion.responseText);
        }
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