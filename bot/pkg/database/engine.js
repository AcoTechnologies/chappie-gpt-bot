// Database handler for bot's postgresql database

const { Pool } = require('pg');
const logging = require('../logger');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

pool.on('error', (err, client) => {
    logging.logger.error('Unexpected error on idle client', err);
    process.exit(-1);
}
);

module.exports = {
    query: (text, params) => pool.query(text, params),
    getClient: (callback) => {
        pool.connect((err, client, done) => {
            callback(err, client, done);
        });
    }
};