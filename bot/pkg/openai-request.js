const logging = require('./logger.js');
const XMLHttpRequest = require('xhr2');

const openaiUrl = `https://api.openai.com/${process.env.OPENAI_VERSION}/chat/completions`;

function handleApiError(msgEvent, response, httpCompletion) {
    /* Handle errors from the OpenAI API */

    logging.logger.error(`Error: ${httpCompletion.status}`);

    try {
        const jsonResponse = JSON.parse(response); // Parse the response to JSON

        if (jsonResponse['message'] && jsonResponse['message'].includes('That model is currently overloaded with other requests.')) { // If the error message is that the model is overloaded
            msgEvent.reply("Chappie is currently overloaded with other requests. Please try again later.");
            logging.logger.error(`Error: ${jsonResponse['message']}`);
        }
    } catch (e) {
        logging.logger.error(e); // handle error on either parsing the response or sending the message
    }
}

function handleTooLongMessage(msgEvent, botResponse) {
    /* Discord has a limit of 2000 characters per message, so we need to split the response into multiple messages */

    logging.logger.info("Message too long, splitting into multiple messages");
    const messageLines = botResponse.split("\n");
    let charactersInMessage = 0;
    let reducedResponse = "";

    messageLines.forEach(line => { 
        if (charactersInMessage > 1500) { // If the message size has exceeded 1500 characters, send the message
            msgEvent.reply(reducedResponse); // Send the message
            reducedResponse = "";
            charactersInMessage = 0;
        }
        reducedResponse += `${line}\n`; // Add the line to the message
        charactersInMessage += line.length; // Add the length of the line to the character count
    });

    msgEvent.reply(reducedResponse); // Send the last message
}

function requestHandler(msgEvent, response, httpCompletion) {
    /* Handle the response from the OpenAI API */
    if (httpCompletion.status !== 200) { // If the response is not 200, handle the error
        handleApiError(msgEvent, response, httpCompletion); // Handle the error
        return;
    }

    try {
        logging.logger.info(`Response: ${response}`); // Log the response
        const jsonResponse = JSON.parse(response); // Parse the response to JSON
        const botResponse = jsonResponse.choices[0].message.content; // Get the response from the JSON

        try {
            if (botResponse.length > 2000) { // If the response is longer than 2000 characters, throw an error
                throw { code: 50035, message: "Message too long" }; // Throw an error
            }
            msgEvent.reply(botResponse); // Send the response
        } catch (e) {
            if (e.code === 50035) { // If the error is that the message is too long
                handleTooLongMessage(msgEvent, botResponse); // Handle the error
            } else {
                logging.logger.error(e); // Log the error
            }
        }
    } catch (e) {
        logging.logger.error(e);
    }
}

function chat(msgEvent, model, botContext) {
    logging.logger.debug(botContext);
    const data = {
        model: model,
        messages: botContext,
    };

    logging.logger.info(`url: ${openaiUrl}`);

    const httpCompletion = new XMLHttpRequest();
    httpCompletion.open("POST", openaiUrl);
    httpCompletion.setRequestHeader("Content-Type", "application/json");
    httpCompletion.setRequestHeader("Authorization", `Bearer ${process.env.OPENAI_API_KEY}`);
    httpCompletion.send(JSON.stringify(data));

    httpCompletion.onreadystatechange = () => {
        if (httpCompletion.readyState === 4) {
            const response = httpCompletion.responseText;
            requestHandler(msgEvent, response, httpCompletion);
        }
    };

    return httpCompletion;
}

module.exports = { chat };
