// Database handler for bot's postgresql database

const { Pool } = require('pg');
const logging = require('./logger');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
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

// this is how to use the database handler:
//
// const { query } = require('./database');
//
// query('SELECT * FROM users WHERE id = $1', [1])
//     .then(res => console.log(res.rows[0]))
//     .catch(e => console.error(e.stack));
//
// or
//
// const { getClient } = require('./database');
//
// getClient((err, client, done) => {
//     if (err) throw err;
//     client.query('SELECT * FROM users WHERE id = $1', [1], (err, res) => {
//         done();
//         if (err) {
//             console.log(err.stack);
//         } else {
//             console.log(res.rows[0]);
//         }
//     });
// });
