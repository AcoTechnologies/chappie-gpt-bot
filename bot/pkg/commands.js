const { getSession, addSession, updateSession } = require('./database/sessions.js');
const { getUser, addUser, checkUserPermission } = require('./database/users.js');
const { getPreset } = require('./database/presets.js');
var logging = require('./logger.js');
var phrases = require('../config/phrases.json');

// funtion package for the command handler(s)
async function slashCommandHandler(interaction) {
    logging.logger.debug(interaction);
    // check if user exists
    var user = await getUser(interaction.user.id);
    if (user == null) {
        logging.logger.info("User does not exist, creating it");
        user = await addUser(interaction.user.id, interaction.user.username);
        if (user == null) {
            logging.logger.error("Error creating user");
            return;
        }
    }
    // log user information
    logging.logger.info("User id: " + user.id + ", username: " + user.username);

    // check if session exists
    var session = await getSession(interaction.guildId, interaction.channelId);
    if (session == null) {
        // create a new session
        logging.logger.info("Session does not exist, creating it");
        session = await addSession(interaction.guildId, interaction.channelId, false);
        if (session == null) {
            logging.logger.error("Error creating session");
            return;
        }
    }
    // log session information
    logging.logger.info("Session; id: " + session.id + " guild: " + session.guild_id + ", channel: " + session.channel_id + ", active: " + session.active);
    if (!interaction.isChatInputCommand()) {
        logging.logger.info("Not a chat input command");
        return;
    }
    // none-priviledged commands
    else if (interaction.commandName === 'ping') {
        var permitted = await checkUserPermission(user.id, "command_ping");
        if (!permitted) {
            await interaction.reply(phrases.auth.unauthorized[Math.floor(Math.random() * phrases.auth.unauthorized.length) | 0]);
            return;
        }
        logging.logger.info("Pong!");
        await interaction.reply('Pong!');
        return;
    }
    else if (interaction.commandName === 'model') {
        var permitted = await checkUserPermission(user.id, "command_model");
        if (!permitted) {
            await interaction.reply(phrases.auth.unauthorized[Math.floor(Math.random() * phrases.auth.unauthorized.length) | 0]);
            return;
        }
        logging.logger.info("Model command");
        await interaction.reply('Model: ' + bot_model);
        return;
    }
    else if (interaction.commandName === 'enable') {
        var permitted = await checkUserPermission(user.id, "command_enable");
        if (!permitted) {
            await interaction.reply(phrases.auth.unauthorized[Math.floor(Math.random() * phrases.auth.unauthorized.length) | 0]);
            return;
        }
        logging.logger.info("Enabling AI");
        // search for session
        var session = await getSession(interaction.guildId, interaction.channelId);
        if (session == null) {
            logging.logger.info("Session does not exist, creating it");
            session = await addSession(interaction.guildId, interaction.channelId, true);
            if (session == null) {
                logging.logger.error("Error creating session");
                return;
            }
            logging.logger.info("Session created: " + session.id);
        }
        // if session exists, set it to active
        else {
            logging.logger.info("Session exists: " + session.id + ", setting it to active");
            session.active = true;
        }
        new_session = await updateSession(session);
        if (new_session == null) {
            logging.logger.error("Error updating session");
            return;
        }
        await interaction.reply(phrases.power.on[Math.floor(Math.random() * phrases.power.on.length) | 0]);
        return;
    }
    else if (interaction.commandName === 'disable') {
        var permitted = await checkUserPermission(user.id, "command_disable");
        if (!permitted) {
            await interaction.reply(phrases.auth.unauthorized[Math.floor(Math.random() * phrases.auth.unauthorized.length) | 0]);
            return;
        }
        logging.logger.info("Disabling AI");
        // search for session
        var session = await getSession(interaction.guildId, interaction.channelId);
        if (session == null) {
            logging.logger.info("Session does not exist, creating it");
            session = await addSession(interaction.guildId, interaction.channelId, true);
            if (session == null) {
                logging.logger.error("Error creating session");
                return;
            }
            logging.logger.info("Session created: " + session.id);
        }
        // if session exists, set it to inactive
        else {
            logging.logger.info("Session exists: " + session.id + ", setting it to inactive");
            session.active = false;
        }
        new_session = await updateSession(session);
        if (new_session == null) {
            logging.logger.error("Error updating session");
            return;
        }
        await interaction.reply(phrases.power.off[Math.floor(Math.random() * phrases.power.off.length) | 0]);
        return;
    }

    // command to change mode
    else if (interaction.commandName === 'setmode') {
        var permitted = await checkUserPermission(user.id, "command_setmode");
        if (!permitted) {
            await interaction.reply(phrases.auth.unauthorized[Math.floor(Math.random() * phrases.auth.unauthorized.length) | 0]);
            return;
        }
        // this will set the AI's preset
        logging.logger.info("Setting mode");
        // get the preset from the interaction
        var preset = interaction.options.getString('mode');
        // search for session
        // search for session
        var session = await getSession(interaction.guildId, interaction.channelId);
        if (session == null) {
            session = await addSession(interaction.guildId, interaction.channelId, true);
            if (session == null) {
                logging.logger.error("Error creating session");
                return;
            }
        }
        // change the preset
        var preset_db = await getPreset(preset);
        if (preset_db == null) {
            logging.logger.error("Error getting preset from database");
            interaction.reply(phrases.statusCodes["404"][Math.floor(Math.random() * phrases.statusCodes["404"].length) | 0]);
            return;
        }
        session.bot_preset_id = preset_db.id;
        // update the session
        var new_session = await updateSession(session);
        if (new_session == null) {
            logging.logger.error("Error updating session");
            return;
        }
        // reply with the preset
        await interaction.reply("Set mode to " + preset_db.preset_name);
        return;

    }
}


module.exports = {
    slashCommandHandler,
}