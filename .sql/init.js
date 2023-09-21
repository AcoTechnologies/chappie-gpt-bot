const { Pool } = require('pg');

// Database connection configuration
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false,
    },
});

// Function to insert test data into the session table
const initSessionTestData = async () => {
    /* session table schema:
        -- column 1: id, the id of the session, randomly generated
        -- column 2: channel id of the session
        -- column 3: guild id of the session, foreign key to guild table
        -- column 4: active, whether the session is active or not, bool
        -- column 5: created at, when the session was created
        -- column 6: updated at, when the session was last updated
    */
    try {
        const client = await pool.connect();

        // Insert test session data
        await client.query(`
            INSERT INTO session (id, channel_id, guild_id, active, created_at, updated_at)
            VALUES ('session1', 'channel1', 'guild1', true, NOW(), NOW()),
                     ('session2', 'channel2', 'guild2', true, NOW(), NOW());
        `);
    } catch (error) {
        console.error('Error inserting test session data:', error);
    }
};

// Function to insert test data into the guild table
const insertGuildTestData = async () => {
    try {
        const client = await pool.connect();

        // Insert test guild data
        await client.query(`
            INSERT INTO guild (id, bot_owner, created_at, updated_at)
            VALUES ('guild1', 'owner1', NOW(), NOW()),
                   ('guild2', 'owner2', NOW(), NOW());
        `);

        client.release();
        console.log('Test guild data inserted successfully.');
    } catch (error) {
        console.error('Error inserting test guild data:', error);
    }
};

// Call the functions to insert test data
insertSessionTestData();
insertGuildTestData();
