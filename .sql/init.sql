-- Create the user table for storing users that have activated the API
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create the guild table for storing guild activation data
CREATE TABLE IF NOT EXISTS guilds (
    id VARCHAR(255) PRIMARY KEY,
    bot_owner INT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (bot_owner) REFERENCES users(id)
);

-- Create the guild_sessions table for storing discord guild_sessions data
CREATE TABLE IF NOT EXISTS guild_sessions (
    id SERIAL PRIMARY KEY,
    channel_id VARCHAR(255) NOT NULL,
    guild_id VARCHAR(255) NOT NULL,
    active BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (guild_id) REFERENCES guilds(id)
);

-- Create the bot roles table for storing roles that the bot owner and administrators can assign
CREATE TABLE IF NOT EXISTS bot_roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create the permissions table for storing permissions that can be assigned to roles
CREATE TABLE IF NOT EXISTS permissions (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
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
    user_id INT NOT NULL,
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
    name VARCHAR(255) NOT NULL,
    data JSON NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
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
    user_id INT NOT NULL,
    scope_id INT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (guild_id) REFERENCES guilds(id),
    FOREIGN KEY (user_id) REFERENCES users (id),
    FOREIGN KEY (scope_id) REFERENCES scopes (id)
);

