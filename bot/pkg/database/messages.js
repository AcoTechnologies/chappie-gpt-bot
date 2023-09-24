const { query } = require('./engine.js');
const logging = require('../logger');
const { DateTime } = require('luxon');

async function addMessage(session, user, message, botMentioned) {
    try {
        var timerbypass = false;
        var token_count = message.split(" ").length;

        // check if the user has a chat_session in the chat_sessions table, for this guild_session
        const chatSession = await query(`
            SELECT *
            FROM chat_sessions
            WHERE user_id = $1
            AND guild_session_id = $2
        `, [user.id, session.id]);

        if (chatSession.rows.length == 0 && botMentioned) {
            // user does not have a chat_session in the chat_sessions table, for this guild_session
            // add a chat_session for this user, for this guild_session
            logging.logger.debug('user does not have a chat_session in the chat_sessions table, for this guild_session');
            await query(`
                INSERT INTO chat_sessions (user_id, guild_session_id)
                VALUES ($1, $2)
            `, [user.id, session.id]);
        } else if (chatSession.rows.length > 0) {
            // user has a chat_session in the chat_sessions table, for this guild_session
            // check if the user has sent a message in the last 120 seconds
            // Parse the PostgreSQL timestamp into a Luxon DateTime object
            const updatedAt = DateTime.fromSQL(chatSession.rows[0].updated_at);
            logging.logger.debug('updatedAt:', updatedAt);
            logging.logger.debug('DateTime.now().minus({ seconds: 120 }):', DateTime.now().minus({ seconds: 120 }));

            if (updatedAt > DateTime.now().minus({ seconds: 120 })) {
                // user has sent a message in the last 120 seconds
                timerbypass = true;
                // update the chat_session
                await query(`
                    UPDATE chat_sessions
                    SET updated_at = $1
                    WHERE id = $2
                `, [DateTime.now(), chatSession.rows[0].id]);
            }
            else {
                // user has not sent a message in the last 120 seconds
                // delete the chat_session
                await query(`
                    DELETE FROM chat_sessions
                    WHERE id = $1
                `, [chatSession.rows[0].id]);
            }
        }

        // create new message and return it
        const newMessage = await query(`
            INSERT INTO chat_messages (session_id, user_id, message_content, token_count)
            VALUES ($1, $2, $3, $4)
            RETURNING *
        `, [session.id, user.id, message, token_count]);

        return [newMessage.rows[0], timerbypass];

    } catch (error) {
        logging.logger.error('Error adding message to database:', error);
        return [null, null];
    }
}

async function getMessages(limit, guild_session_id) { // this function gets the latest messages from the database
    try {
        // get the latest log from the database, join with the users table to get the username, join with the guild_sessions table to get the bot_preset_id, join with the bot_presets table to get the bot_preset.preset_data
        const queryResult = await query(`
            SELECT chat_messages.*, users.username, guild_sessions.bot_preset_id, bot_presets.preset_data
            FROM chat_messages
            INNER JOIN users
            ON chat_messages.user_id = users.id
            INNER JOIN guild_sessions
            ON chat_messages.session_id = guild_sessions.id
            INNER JOIN bot_presets
            ON guild_sessions.bot_preset_id = bot_presets.id
            WHERE guild_sessions.id = $1
            ORDER BY chat_messages.id DESC
            LIMIT $2
        `, [guild_session_id, limit]);

        logging.logger.debug('queryResult.rows:', queryResult.rows);

        var openai_formatted_messages = openaiFormatResults(queryResult.rows);

        return openai_formatted_messages;

    } catch (error) {
        logging.logger.error('Error getting messages from database:', error);
        return null;
    }
}

function openaiFormatResults(results) {
    /*
    This function takes the results from the database and formats them for OpenAI API chat completion models.
    The expected input format is:
    [
        {
            "id": 1,
            "session_id": 1,
            "user_id": 1,
            "message_content": "Hello",
            "token_count": 1,
            "username": "user1",
            "bot_preset_id": 1,
            "preset_data": {
                "<NAME>": [
                    {"role": "system", "content": "You are a helpful bot."},
                    {"role": "user", "content": "Username: Hello, how are you?"},
                    {"role": "assistant", "content": "I am doing well, how are you?"},
                    {"role": "user", "content": "Username: I am doing well, thanks for asking."},
                    {"role": "assistant", "content": "That's great to hear!"},
                    ... and so on
                ]
            }
        },
        ... and so on
    ]
    The expected output format is:
    [
        {"role": "system", "content": "You are a helpful bot."},
        {"role": "user", "content": "Username: Hello, how are you?"},
        {"role": "assistant", "content": "I am doing well, how are you?"},
        {"role": "user", "content": "Username: I am doing well, thanks for asking."},
        {"role": "assistant", "content": "That's great to hear!"},
        and then a continuation of the conversation containing the chat history
        {"role": "user", "content": "UsernameA: This is so much fun!"},
        {"role": "user", "content": "UsernameB: I agree, this is fun! what do you think chappie?"},
        {"role": "assistant", "content": "I think this is fun too!"},
        ... and so on
    ]
    */
    var reduced_results = reduceToTokens(results, 3000);
    results = reduced_results;
    var openai_formatted_messages = [];
    // preset data is the same for each row, so just take it from the first row
    const preset_data = results[0].preset_data;
    // get the name of the preset(key), and the preset data(value)
    const [preset_name, preset_messages] = Object.entries(preset_data)[0];
    logging.logger.debug('preset_name:', preset_name);
    // add the preset data to the openai_formatted_messages array
    openai_formatted_messages = openai_formatted_messages.concat(preset_messages);
    // add the messages from the database to the openai_formatted_messages array,
    // add "role": "user" to the user messages, and "role": "assistant" to the bot messages
    // the messages are in reverse order, so reverse them again
    var messages = results.reverse();
    messages.forEach(message => {
        if (message.username == "chappie") {
            openai_formatted_messages.push({
                "role": "assistant",
                "content": message.message_content
            });
        } else {
            openai_formatted_messages.push({
                "role": "user",
                "content": message.username + ": " + message.message_content
            });
        }
    });
    return openai_formatted_messages;
}

function reduceToTokens(results, tokenCap) {
    // This function takes the results from the database and reduces them to a maximum number of tokens.

    // get the total number of tokens
    var totalTokens = 0;
    var reduced_results = [];
    results.forEach(message => {
        totalTokens += message.token_count;
        reduced_results.push(message);
        if (totalTokens > tokenCap) {
            return reduced_results;
        }
    });
    return reduced_results;
}



module.exports = {
    addMessage,
    getMessages,
};