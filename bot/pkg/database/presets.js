const { query } = require('./engine.js');
const logging = require('../logger');

async function getPreset(name) {
    try {
        const queryResult = await query(`
            SELECT *
            FROM bot_presets
            WHERE preset_name = $1
        `, [name]);

        return queryResult.rows[0];
    } catch (error) {
        logging.logger.error('Error getting preset from database:', error);
        return null;
    }
}

module.exports = {
    getPreset,
};