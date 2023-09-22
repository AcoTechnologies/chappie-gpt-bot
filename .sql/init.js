
const { Pool } = require('pg');
const init_data = require('./init.json');
const presets = require('../bot/config/bot-presets.json');



// Database connection configuration
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

const guild_id = init_data.guild_id;
const bot_owner = init_data.owner;
const bot_admins = init_data.admins;
const bot_token = init_data.bot_token;
const bot_client_id = init_data.bot_client_id;
const openai_api_key = init_data.openai_api_key;

const client = await pool.connect();

// Function to init users table
const initUsers = async () => {
    try {
        // Insert test user data
        await client.query(`
            INSERT INTO user (id, created_at, updated_at)
            VALUES ('${bot_owner}', NOW(), NOW());`);
        client.release();
        console.log('Test user data inserted successfully.');

    } catch(error) {
        console.error('Error inserting test user data:', error);
    }
};

// Function to init bot_role table
const initBotRoles = async () => {
    try {
        // Insert test bot_role data
        await client.query(`
            INSERT INTO bot_role (name, created_at, updated_at)
            VALUES (
                ('owner', NOW(), NOW()),
                ('admin', NOW(), NOW()),
                ('member', NOW(), NOW())
            )`);
        client.release();
        console.log('Test bot_role data inserted successfully.');

    } catch(error) {
        console.error('Error inserting test bot_role data:', error);
    }
};



// Function to init permission table
/*
slashCommandPermissions: [
    "ping",
    "enable",
    "disable",
    "model",
    "setmode"
]
Chat permissions: [
    "chat"
]
 */
const initPermissions = async () => {
    try {
        // Insert test permission data
        await client.query(`
            INSERT INTO permission (name, created_at, updated_at)
            VALUES (
                ('command_ping', NOW(), NOW()),
                ('command_enable', NOW(), NOW()),
                ('command_disable', NOW(), NOW()),
                ('command_model', NOW(), NOW()),
                ('command_setmode', NOW(), NOW()),
                ('chat', NOW(), NOW())
            )`);
        client.release();
        console.log('Test permission data inserted successfully.');

    } catch(error) {
        console.error('Error inserting test permission data:', error);
    }
};

// Function to init role_permission table
const initRolePermissions = async () => {
    try {
        // Insert test role_permission data
        await client.query(`
            INSERT INTO role_permission (role_id, permission_id, created_at, updated_at)
            VALUES (
                ('owner', 'command_ping', NOW(), NOW()),
                ('owner', 'command_enable', NOW(), NOW()),
                ('owner', 'command_disable', NOW(), NOW()),
                ('owner', 'command_model', NOW(), NOW()),
                ('owner', 'command_setmode', NOW(), NOW()),
                ('owner', 'chat', NOW(), NOW()),
                ('admin', 'command_ping', NOW(), NOW()),
                ('admin', 'command_enable', NOW(), NOW()),
                ('admin', 'command_disable', NOW(), NOW()),
                ('admin', 'command_model', NOW(), NOW()),
                ('admin', 'command_setmode', NOW(), NOW()),
                ('admin', 'chat', NOW(), NOW()),
                ('member', 'command_ping', NOW(), NOW()),
                ('member', 'command_enable', NOW(), NOW()),
                ('member', 'command_disable', NOW(), NOW()),
                ('member', 'command_model', NOW(), NOW()),
                ('member', 'command_setmode', NOW(), NOW()),
                ('member', 'chat', NOW(), NOW())
            )`);
        client.release();
        console.log('Test role_permission data inserted successfully.');

    } catch(error) {
        console.error('Error inserting test role_permission data:', error);
    }
};

// Function to init user_role table
const initUserRoles = async () => {
    try {
        // Insert test user_role data
        await client.query(`
            INSERT INTO user_role (user_id, role_id, created_at, updated_at)
            VALUES (
                ('${bot_owner}', 'owner', NOW(), NOW()),
                ('${bot_owner}', 'admin', NOW(), NOW()),
                ('${bot_owner}', 'member', NOW(), NOW())
            )`);
        client.release();
        console.log('Test user_role data inserted successfully.');

    } catch(error) {
        console.error('Error inserting test user_role data:', error);
    }
};

// Function to init bot_preset table
const initBotPresets = async () => {
    try {
        keys = Object.keys(presets);

        // Insert test bot_preset data
        keys.forEach(async (key) => {
            await client.query(`
                INSERT INTO bot_preset (name, data, created_at, updated_at)
                VALUES (
                    ('${key}', '${JSON.stringify({key: presets[key]})}', NOW(), NOW())
                )`);
        });
        client.release();
        console.log('Test bot_preset data inserted successfully.');

    } catch(error) {
        console.error('Error inserting test bot_preset data:', error);
    }
};

// Function to init guild_preset table
const initGuildPresets = async () => {
    try {
        keys = Object.keys(presets);

        // Insert test guild_preset data
        keys.forEach(async (key) => {
            await client.query(`
                INSERT INTO guild_preset (preset_id, guild_id, created_at, updated_at)
                VALUES (
                    ('${key}', '${guild_id}', NOW(), NOW())
                )`);
        });
        client.release();
        console.log('Test guild_preset data inserted successfully.');

    } catch(error) {
        console.error('Error inserting test guild_preset data:', error);
    }
};

// Function to init guild table
const initGuild = async () => {
    try {
        // Insert test guild data
        await client.query(`
            INSERT INTO guild (id, bot_owner, created_at, updated_at)
            VALUES ('${guild_id}', '${bot_owner}', NOW(), NOW());`);
        client.release();
        console.log('Test guild data inserted successfully.');

    } catch(error) {
        console.error('Error inserting test guild data:', error);
    }
};

// Function to init guild_api_activation table
const initGuildApiActivation = async () => {
    try {
        // Insert test guild_api_activation data
        await client.query(`
            INSERT INTO guild_api_activation (guild_id, api_key, user_id, scope, created_at, updated_at)
            VALUES ('${guild_id}', '${openai_api_key}', '${bot_owner}', 'chat', NOW(), NOW());`);
        client.release();
        console.log('Test guild_api_activation data inserted successfully.');

    } catch(error) {

        console.error('Error inserting test guild_api_activation data:', error);
    }
};

// Function to init scope table
const initScope = async () => {
    try {
        // Insert test scope data
        await client.query(`
            INSERT INTO scope (name, created_at, updated_at)
            VALUES ('chat', NOW(), NOW());`);
        client.release();
        console.log('Test scope data inserted successfully.');
        
    } catch(error) {
        console.error('Error inserting test scope data:', error);
    }
};

// Call the functions to insert test data

initUsers();
initBotRoles();
initPermissions();
initRolePermissions();
initUserRoles();
initBotPresets();
initGuildPresets();
initGuild();
initGuildApiActivation();
initScope();

// Close the database connection
pool.end();