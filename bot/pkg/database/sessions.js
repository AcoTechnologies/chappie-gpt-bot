const { query } = require('./engine.js');
const logging = require('../logger');
const { getPreset } = require('./presets.js');

async function getSession(guild_id, channel_id) {
    // gets a session from the database by guild_id and channel_id
    try {
        const queryResult = await query(`
            SELECT *
            FROM guild_sessions
            WHERE guild_id = $1
            AND channel_id = $2
        `, [guild_id, channel_id]);

        return queryResult.rows[0];
    } catch (error) {
        logging.logger.error('Error getting session from database:', error);
        return null;
    }
}

async function addSession(guild_id, channel_id, active) {
    // adds a session to the database, and sets the bot_preset_id to the default preset
    try {
        // get the deault preset
        var defaultPreset = await getPreset('default');
        if ( defaultPreset == null ) {
            logging.logger.error('Error getting default preset from database.');
            return null;
        }
        // create new session and return it
        const queryResult = await query(`
            INSERT INTO guild_sessions (guild_id, channel_id, bot_preset_id, active)
            VALUES ($1, $2, $3, $4)
            RETURNING *
        `, [guild_id, channel_id, defaultPreset.id, active]);

        return queryResult.rows[0];

    } catch (error) {
        logging.logger.error('Error adding session to database:', error);
        return null;
    }
}

async function updateSession(session) {
    // updates preset_id and active values in the session
    try {
        // update the session and return it
        const queryResult = await query(`
            UPDATE guild_sessions
            SET bot_preset_id = $1, active = $2
            WHERE id = $3
            RETURNING *
        `, [session.bot_preset_id, session.active, session.id]);

        return queryResult.rows[0];

    } catch (error) {
        logging.logger.error('Error updating session in database:', error);
        return null;
    }
}



module.exports = {
    getSession,
    addSession,
    updateSession,
};