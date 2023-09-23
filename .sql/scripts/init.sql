-- Create the user table for storing users that have activated the API
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(255) PRIMARY KEY,
    username VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create the guild table for storing guild activation data
CREATE TABLE IF NOT EXISTS guilds (
    id VARCHAR(255) PRIMARY KEY,
    bot_owner VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (bot_owner) REFERENCES users(id)
);

-- Create the bot roles table for storing roles that the bot owner and administrators can assign
CREATE TABLE IF NOT EXISTS bot_roles (
    id SERIAL PRIMARY KEY,
    role_name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create the permissions table for storing permissions that can be assigned to roles
CREATE TABLE IF NOT EXISTS permissions (
    id SERIAL PRIMARY KEY,
    permission_name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create the role permissions table for linking roles and permissions
CREATE TABLE IF NOT EXISTS role_permissions (
    role_id INT NOT NULL,
    permission_id INT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (role_id, permission_id),
    FOREIGN KEY (role_id) REFERENCES bot_roles (id),
    FOREIGN KEY (permission_id) REFERENCES permissions (id)
);

-- Create the user roles table for linking users and roles
CREATE TABLE IF NOT EXISTS user_roles (
    user_id VARCHAR(255) NOT NULL,
    role_id INT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, role_id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (role_id) REFERENCES bot_roles (id)
);

-- Create the bot presets table for storing bot presets
CREATE TABLE IF NOT EXISTS bot_presets (
    id SERIAL PRIMARY KEY,
    preset_name VARCHAR(255) NOT NULL,
    preset_data JSON NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create the guild_sessions table for storing discord guild_sessions data
CREATE TABLE IF NOT EXISTS guild_sessions (
    id SERIAL PRIMARY KEY,
    channel_id VARCHAR(255) NOT NULL,
    guild_id VARCHAR(255) NOT NULL,
    active BOOLEAN NOT NULL DEFAULT false,
    bot_preset_id INT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (guild_id) REFERENCES guilds(id),
    FOREIGN KEY (bot_preset_id) REFERENCES bot_presets (id),
    -- the combination of channel_id and guild_id must be unique
    CONSTRAINT unique_channel_guild UNIQUE (channel_id, guild_id)
);

-- Create the guild presets table for linking guilds and presets
CREATE TABLE IF NOT EXISTS guild_presets (
    preset_id INT NOT NULL,
    guild_id VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (preset_id, guild_id),
    FOREIGN KEY (preset_id) REFERENCES bot_presets (id),
    FOREIGN KEY (guild_id) REFERENCES guilds(id)
);

-- Create the scopes table for storing API scopes
CREATE TABLE IF NOT EXISTS scopes (
    id SERIAL PRIMARY KEY,
    scope_name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create the guild API activations table for storing API activations in a guild
CREATE TABLE IF NOT EXISTS guild_api_activations (
    id SERIAL PRIMARY KEY,
    guild_id VARCHAR(255) NOT NULL,
    api_key VARCHAR(255) NOT NULL,
    user_id VARCHAR(255) NOT NULL,
    scope_id INT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (guild_id) REFERENCES guilds(id),
    FOREIGN KEY (user_id) REFERENCES users (id),
    FOREIGN KEY (scope_id) REFERENCES scopes (id)
);

-- Create the chat messages table for storing chat messages, # TODO: The message content should be encrypted, with a unique key per session, maybe just in memory, for a short time
CREATE TABLE IF NOT EXISTS chat_messages (
    id SERIAL PRIMARY KEY,
    message_content TEXT NOT NULL,
    token_count INT NOT NULL,
    session_id INT NOT NULL,
    user_id VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
