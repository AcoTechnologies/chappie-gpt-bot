
const { Pool } = require('pg');
const presets = require('../bot/config/bot-presets.json');



// Database connection configuration
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

const guild_id = process.env.DISCORD_GUILD_ID;
const bot_owner = process.env.DISCORD_OWNER_ID;
const openai_api_key = process.env.OPENAI_API_KEY;

const client = await pool.connect();

// Function to init users table
const initUsers = async () => {
    try {
        // Insert test user data
        await client.query(`
            INSERT INTO users (id)
            VALUES ('${bot_owner}');`);
        
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
            INSERT INTO bot_roles (role_name)
            VALUES 
                ('owner'),
                ('admin'),
                ('member')`);
        
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
            INSERT INTO permissions (permission_name)
            VALUES 
                ('command_ping'),
                ('command_enable'),
                ('command_disable'),
                ('command_model'),
                ('command_setmode'),
                ('chat')
            `);
        
        console.log('Test permission data inserted successfully.');

    } catch(error) {
        console.error('Error inserting test permission data:', error);
    }
};

// Function to init role_permission table
const initRolePermissions = async () => {
    try {
        // get permissions
        var permissions = await client.query(`
            SELECT permission_name, id
            FROM permissions
            `);

        // get all bot roles
        var bot_roles = await client.query(`
            SELECT role_name, id
            FROM bot_roles
            `);
        // setup values query with ids to match name map
        const map = {
            "owner": ["command_ping","command_enable","command_disable","command_model","command_setmode","chat"],
            "admin": ["command_ping","command_enable","command_disable","command_model","command_setmode","chat"],
            "member": ["command_ping","command_enable","command_disable","command_model","command_setmode","chat"]
        };
        var values = "";
        bot_roles.rows.forEach((role) => {
            map[role.role_name].forEach((permission) => {
                values += `('${role.id}', '${permissions.rows.find(p => p.permission_name == permission).id}'),`;

            });
        });
        // Insert test role_permission data
        await client.query(`
            INSERT INTO role_permissions (role_id, permission_id)
            VALUES ${values.slice(0, -1)}`);
        
        console.log('Test role_permission data inserted successfully.');

    } catch(error) {
        console.error('Error inserting test role_permission data:', error);
    }
};

// Function to init user_role table
const initUserRoles = async () => {
    try {
        // get the role id for owner
        var owner_role_ids = await client.query(`
            SELECT id
            FROM bot_roles
            WHERE role_name = 'owner'
            `);
        var owner_role_id = owner_role_ids.rows[0].id;
        // Insert test user_role data: owner, admin, member
        await client.query(`
            INSERT INTO user_roles (user_id, role_id)
            VALUES 
                ('${bot_owner}', '${owner_role_id}')
            `);
        
        console.log('Test user_role data inserted successfully.');

    } catch(error) {
        console.error('Error inserting test user_role data:', error);
    }
};

// Function to init bot_preset table
const initBotPresets = async () => {
    try {
        var keys = Object.keys(presets);

        // Insert test bot_preset data
        for (const key of keys) {
            const presetData = JSON.stringify({ [key]: presets[key] });
            await client.query({
                text: 'INSERT INTO bot_presets (preset_name, preset_data) VALUES ($1, $2)',
                values: [key, presetData],
            });
        }

        console.log('Test bot_preset data inserted successfully.');

    } catch (error) {
        console.error('Error inserting test bot_preset data:', error);
    }
};


// Function to init guild_preset table
const initGuildPresets = async () => {
    try {
        // Select all preset IDs from bot_presets
        const presetIdsQuery = await client.query(`
            SELECT id
            FROM bot_presets
        `);

        // Extract the IDs from the query result
        const presetIds = presetIdsQuery.rows.map((row) => row.id);

        // Insert test guild_preset data for each preset ID
        for (const presetId of presetIds) {
            await client.query(`
                INSERT INTO guild_presets (preset_id, guild_id)
                VALUES ('${presetId}', '${guild_id}')
            `);
        }

        console.log('Test guild_preset data inserted successfully.');

    } catch (error) {
        console.error('Error inserting test guild_preset data:', error);
    }
};

// Function to init guild table
const initGuild = async () => {
    try {
        // Insert test guild data
        await client.query(`
            INSERT INTO guilds (id, bot_owner)
            VALUES ('${guild_id}', '${bot_owner}');`);
        
        console.log('Test guild data inserted successfully.');

    } catch(error) {
        console.error('Error inserting test guild data:', error);
    }
};

// Function to init guild_api_activation table
const initGuildApiActivation = async () => {
    try {
        // get scope id of scope 'global'
        var scope_id = await client.query(`
            SELECT id
            FROM scopes
            WHERE scope_name = 'global'
            `);
        scope_id = scope_id.rows[0].id;

        // Insert test guild_api_activation data
        await client.query(`
            INSERT INTO guild_api_activations (guild_id, api_key, user_id, scope_id)
            VALUES ('${guild_id}', '${openai_api_key}', '${bot_owner}', '${scope_id}');`);
        
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
            INSERT INTO scopes (scope_name)
            VALUES ('global');`);
        
        console.log('Test scope data inserted successfully.');
        
    } catch(error) {
        console.error('Error inserting test scope data:', error);
    }
};

// Call the functions to insert test data, in order

await initUsers();
await initScope();
await initBotRoles();
await initPermissions();
await initRolePermissions();
await initUserRoles();
await initBotPresets();
await initGuild();
await initGuildPresets();
await initGuildApiActivation();


// Close the database connection
client.release();
pool.end();