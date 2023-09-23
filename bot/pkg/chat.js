
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
    // log session information
    logging.logger.info("Session id: " + session.id + ", channel id: " + session.channel_id + ", active: " + session.active);


    var user = await getUser(msg_event.author.id);
    if (user == null) {
        logging.logger.info("User does not exist, creating it");
        user = await addUser(msg_event.author.id, msg_event.author.username);
        if (user == null) {
            logging.logger.error("Error creating user");
            return;
        }
    }
    // log user information
    logging.logger.info("User id: " + user.id + ", username: " + user.username);

    // session.history.addEntry(author, content); deprecated
    var message_db = await addMessage(session, user, content);
    if (message_db == null) {
        logging.logger.error("Error adding message to db");
        return;
    }
    // log message
    logging.logger.info("Message id: " + message_db.id);


    // if session is not active, return
    if (!session.active) {
        logging.logger.info("Session is not active: " + session.channel_id + ", returning");
        return;
    } else {
        logging.logger.debug("Session is active: " + session.channel_id + ", using it");
    }

    // log content, user
    logging.logger.info("Message: " + content);
    logging.logger.info("Author: " + author);

    var botMentioned = scanForKeyword(content, bot_name);

    if (!botMentioned) {
        logging.logger.debug("Bot not mentioned, returning");
        return;
    } else {
        logging.logger.debug("Bot mentioned, using it");
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