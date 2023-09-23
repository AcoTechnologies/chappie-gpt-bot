
const logging = require("./logger.js");
const { getSession, addSession } = require("./database/sessions.js");
const { getUser, addUser } = require("./database/users.js");
const { addMessage, getMessages } = require("./database/messages.js");
const openai = require("./openai-request.js");

function scanForKeyword(message, keyword) {
    /*
    Scan the message for the keyword
    Author: Pete-Senpai
    */
    if (message.toLowerCase().includes(keyword.toLowerCase())) {
        return true;
    } else {
        return false;
    }
}

async function chatHandler(msg_event, bot_name, bot_model) {

    // Message content
    const content = msg_event.content
    
    // Message author
    var author = msg_event.author.global_name
    if (author == undefined) {
        author = msg_event.author.username
    }
    // Message author id
    const author_id = msg_event.author.id

    // get the session if it exists
    var session = await getSession(msg_event.guildId, msg_event.channelId);
    if (session == null) {
        // create a new session
        logging.logger.info("Session does not exist, creating it");
        session = await addSession(msg_event.guildId, msg_event.channelId, false);
        if (session == null) {
            logging.logger.error("Error creating session");
            return;
        }
    }

    var user = await getUser(msg_event.author.id);
    if (user == null) {
        logging.logger.info("User does not exist, creating it");
        user = await addUser(msg_event.author.id, msg_event.author.username);
        if (user == null) {
            logging.logger.error("Error creating user");
            return;
        }
    }

    var [ message_db, timerbypass ] = await addMessage(session, user, content);
    if (message_db == null) {
        logging.logger.error("Error adding message to db");
        return;
    }
    // log message
    logging.logger.info(`message id; ${message_db.id}, session id: ${message_db.session_id}, user id: ${message_db.user_id}, message content: ${message_db.message_content}, token count: ${message_db.token_count}, timerbypass: ${timerbypass}`);


    // if session is not active, return
    if (!session.active) {
        logging.logger.info("Session is not active: " + session.channel_id + ", returning");
        return;
    } else {
        logging.logger.debug("Session is active: " + session.channel_id + ", using it");
    }
    
    // check if the bot mention logic is bypassed by the timer
    if (timerbypass) {
        logging.logger.info("mention logic bypassed by timer");
    }
    else {
        // Check if the bot is mentioned
        var botMentioned = scanForKeyword(content, bot_name);

        if (!botMentioned) {
            logging.logger.debug("Bot not mentioned, returning");
            return;
        } else {
            logging.logger.debug("Bot mentioned, using it");
        }
    }
    // Check if the message is from the bot
    if (author_id != process.env.DISCORD_CLIENT_ID) {
        // Respond with ai response
        msg_event.channel.sendTyping();
        // var bot_context = session.history.getLatestLog(); deprecated
        var bot_context = await getMessages(10, session.id);
        if (bot_context == null) {
            logging.logger.error("Error getting latest logs from db");
            return;
        }
        openai.chat(msg_event, bot_model, bot_context);
    }
}


module.exports = {
    chatHandler,
};