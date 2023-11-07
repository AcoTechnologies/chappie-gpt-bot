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

// New Feature, Mission
// in mission feature, the bot will peform a series of queries to the openai api
// following a mission set by the user
// the end result might be a piece of text, article, a file, or report.
// The mission will define the output format.
// and the bot will query the api back and forth to complete the mission, continuously improving the output
// first the mission statement will be broken down, and a series of bot contexts(roles) for this mission will be defined.
// each of these roles will play a part, and the output will be vetted in a specified sequence by these roles.
// finalizing when the product owner role is satisfied with the output.

// datatype Mission for input to mission function
class Mission {
    constructor() {
        /* 
        Mission class
        missionStatement: string, the mission statement. i.e. "Write a report on the timeline of the .COM bubble"
        roles: array of strings, the roles in the mission. i.e. ["Product Owner", "Researcher", "Writer", "Critique", "Editor"]
        outputFormat: string, the output format of the mission. i.e. "Report"
        output: string, the output of the mission. i.e. "The .COM bubble was a period of time in the 1990s when the internet was first commercialized..."
        */
        this.missionStatement = "";
        this.roles = [];
        this.outputFormat = "";
        this.output = "";
    }
}

function createRoleContexts(role, model) {
    /* Create the bot context for a role title */
    const botContext = [
        {
            "role": "system",
            "content": "You are a prompt engineering AI, that specializes in creating bot contexts for the OpenAI API.",
        },
        {
            "role": "user",
            "content": "Create a bot context for the role of AI assistant helping with math concepts.",
        },
        {
            "role": "assistant",
            "content": "[{\"role\": \"system\", \"content\": \"You are an AI assistant that helps with math concepts.\"}, {\"role\": \"user\", \"content\": \"What is the square root of 4?\"}, {\"role\": \"assistant\", \"content\": \"2\"}, {\"role\": \"user\", \"content\": \"What a quadratic equation?\"}, {\"role\": \"assistant\", \"content\": \"A quadratic equation is a second-degree polynomial equation in a single variable, usually written in the form \(ax^2 + bx + c = 0\), where \(x\) represents the variable, and \(a\), \(b\), and \(c\) are coefficients. The solutions to the quadratic equation, known as roots, can be found using the quadratic formula: \(x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}\).\"}, {\"role\": \"user\", \"content\": \"what is a axiom?\"}, {\"role\": \"assistant\", \"content\": \"An axiom is a self-evident and universally accepted statement or principle that serves as a foundation for reasoning or as a premise for further arguments. It is a fundamental and unquestionable truth that is assumed to be true without requiring proof within a particular system of logic or theory. Axioms form the basis for deductive reasoning and the development of mathematical and philosophical systems.\"}]"
        },
        {
            "role": "user",
            "content": "Create a bot context for the role of Laywer."
        },
        {
            "role": "assistant",
            "content": "[{\"role\": \"system\", \"content\": \"You are an AI assistant that helps with legal concepts.\"}, {\"role\": \"user\", \"content\": \"What is the definition of a contract?\"}, {\"role\": \"assistant\", \"content\": \"A contract is a legally binding agreement between two or more parties that creates an obligation to do or not do particular things.\"}, {\"role\": \"user\", \"content\": \"What is the definition of a tort?\"}, {\"role\": \"assistant\", \"content\": \"A tort is a civil wrong that causes someone else to suffer loss or harm and results in legal liability for the person who commits the tortious act.\"}, {\"role\": \"user\", \"content\": \"What is the definition of a crime?\"}, {\"role\": \"assistant\", \"content\": \"A crime is an act or omission that is prohibited by law and punishable by the state.\"}]"
        },
        {
            "role": "user",
            "content": "Create a bot context for the role of a journalist."
        },
        {
            "role": "assistant",
            "content": "[{\"role\": \"system\", \"content\": \"You are an AI assistant that helps with journalism concepts.\"}, {\"role\": \"user\", \"content\": \"What is the definition of a news article?\"}, {\"role\": \"assistant\", \"content\": \"A news article is a written report on a topic of current interest.\"}, {\"role\": \"user\", \"content\": \"What is the definition of a news story?\"}, {\"role\": \"assistant\", \"content\": \"A news story is a factual account of an event or situation.\"}, {\"role\": \"user\", \"content\": \"What is the definition of a news report?\"}, {\"role\": \"assistant\", \"content\": \"A news report is a factual account of an event or situation.\"}]"
        }
    ]

    // Call the openai api to create the bot context for the input role
    const data = {
        model: model,
        messages: botContext,
    };
    const httpCompletion = new XMLHttpRequest();
    httpCompletion.open("POST", openaiUrl);
    httpCompletion.setRequestHeader("Content-Type", "application/json");
    httpCompletion.setRequestHeader("Authorization", `Bearer ${process.env.OPENAI_API_KEY}`);
    httpCompletion.send(JSON.stringify(data));

    // wait for the response
  return new Promise((resolve, reject) => {
    httpCompletion.onreadystatechange = () => {
      if (httpCompletion.readyState === 4) {
        if (httpCompletion.status === 200) {
          const response = httpCompletion.responseText;
          resolve(response);
        } else {
          reject(new Error("Failed to call OpenAI API"));
        }
      }
    };
  });



}

async function beginMission(msgEvent, model, mission) {
    /* Begin the mission */
    const roleContextPromises = [];

    mission.roles.forEach(role => {
        roleContextPromises.push(createRoleContexts(role, model));
    });

    const roleContexts = await Promise.all(roleContextPromises);

}



module.exports = { chat };
