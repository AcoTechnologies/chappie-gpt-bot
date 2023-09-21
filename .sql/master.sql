-- sql master script for the database

-- create the database
CREATE DATABASE IF NOT EXISTS `bot` DEFAULT CHARACTER SET utf8 COLLATE utf8_general_ci;

-- use the database
USE `bot`;

-- create the session table, for storing discord session data
-- column 1: id, the id of the session, randomly generated
-- column 2: channel id of the session
-- column 3: guild id of the session, foreign key to guild table
-- column 4: active, whether the session is active or not, bool
-- column 5: created at, when the session was created
-- column 6: updated at, when the session was last updated

CREATE TABLE IF NOT EXISTS `session` (
    `id` SERIAL PRIMARY KEY,
    `channel_id` VARCHAR(255) NOT NULL,
    `guild_id` VARCHAR(255) NOT NULL,
    `active` TINYINT(1) NOT NULL DEFAULT 1,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    FOREIGN KEY (`guild_id`) REFERENCES `guild`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- create the guild table, for storing guild activation data
-- column 1: guild id of the guild, foreign key to guild table
-- column 2: bot owner, admin of the bot, foreign key to user table
-- column 3: created at, when the guild activation was created
-- column 4: updated at, when the guild activation was last updated

CREATE TABLE IF NOT EXISTS `guild` (
    `id` VARCHAR(255) NOT NULL,
    `bot_owner` VARCHAR(255) NOT NULL,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    FOREIGN KEY (`bot_owner`) REFERENCES `user`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- bot roles table, for storing the roles that the bot owner and administrators can assign other users
-- column 1: id of the role, foreign key to role table
-- column 2: name of the role
-- column 3: created at, when the role was created
-- column 4: updated at, when the role was last updated

CREATE TABLE IF NOT EXISTS `bot_role` (
    `id` SERIAL PRIMARY KEY,
    `name` VARCHAR(255) NOT NULL,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- permissions table, for storing the permissions that the bot owner and administrators can assign to roles
-- column 1: id of the permission, foreign key to permission table
-- column 2: name of the permission
-- column 3: created at, when the permission was created
-- column 4: updated at, when the permission was last updated

CREATE TABLE IF NOT EXISTS `permission` (
    `id` SERIAL PRIMARY KEY,
    `name` VARCHAR(255) NOT NULL,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- role permissions table, for linking the roles and permissions
-- column 1: id of the role, foreign key to role table
-- column 2: id of the permission, foreign key to permission table
-- column 3: created at, when the role permission was created
-- column 4: updated at, when the role permission was last updated

CREATE TABLE IF NOT EXISTS `role_permission` (
    `role_id` VARCHAR(255) NOT NULL,
    `permission_id` VARCHAR(255) NOT NULL,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`role_id`, `permission_id`),
    FOREIGN KEY (`role_id`) REFERENCES `bot_role`(`id`),
    FOREIGN KEY (`permission_id`) REFERENCES `permission`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- user roles table, for linking the users and roles
-- column 1: id of the user, foreign key to user table
-- column 2: id of the role, foreign key to role table
-- column 3: created at, when the user role was created
-- column 4: updated at, when the user role was last updated

CREATE TABLE IF NOT EXISTS `user_role` (
    `user_id` VARCHAR(255) NOT NULL,
    `role_id` VARCHAR(255) NOT NULL,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`user_id`, `role_id`),
    FOREIGN KEY (`user_id`) REFERENCES `user`(`id`),
    FOREIGN KEY (`role_id`) REFERENCES `bot_role`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- bot presets table, for storing the presets that the bot has
-- column 1: id of the preset, foreign key to preset table
-- column 2: name of the preset
-- column 3: data of the preset, json
-- column 4: created at, when the preset was created
-- column 5: updated at, when the preset was last updated

CREATE TABLE IF NOT EXISTS `bot_preset` (
    `id` SERIAL PRIMARY KEY,
    `name` VARCHAR(255) NOT NULL,
    `data` JSON NOT NULL,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- guild presets table, the presets that the guild has available
-- column 1: id of the preset, foreign key to preset table
-- column 2: id of the guild, foreign key to guild table
-- column 3: created at, when the guild preset was created
-- column 4: updated at, when the guild preset was last updated

CREATE TABLE IF NOT EXISTS `guild_preset` (
    `preset_id` VARCHAR(255) NOT NULL,
    `guild_id` VARCHAR(255) NOT NULL,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`preset_id`, `guild_id`),
    FOREIGN KEY (`preset_id`) REFERENCES `bot_preset`(`id`),
    FOREIGN KEY (`guild_id`) REFERENCES `guild`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- guild api activations, table for the openai api activations in a guild
-- column 1: id of the activation, randomly generated
-- column 2: id of the guild, foreign key to guild table
-- column 3: api key, the api key that was used to activate the api
-- column 4: user id, the user that activated the api
-- column 5: scope, the scope of the api activation
-- column 6: created at, when the api activation was created
-- column 7: updated at, when the api activation was last updated

CREATE TABLE IF NOT EXISTS `guild_api_activation` (
    `id` SERIAL PRIMARY KEY,
    `guild_id` VARCHAR(255) NOT NULL,
    `api_key` VARCHAR(255) NOT NULL,
    `user_id` VARCHAR(255) NOT NULL,
    `scope` VARCHAR(255) NOT NULL,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    FOREIGN KEY (`guild_id`) REFERENCES `guild`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- scopes table, for storing the scopes that the api can be activated with
-- column 1: id of the scope, foreign key to scope table
-- column 2: name of the scope
-- column 3: created at, when the scope was created
-- column 4: updated at, when the scope was last updated

CREATE TABLE IF NOT EXISTS `scope` (
    `id` SERIAL PRIMARY KEY,
    `name` VARCHAR(255) NOT NULL,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- user table, for storing the users that have activated the api
-- column 1: id of the user, foreign key to user table
-- column 2: created at, when the user was created
-- column 3: updated at, when the user was last updated

CREATE TABLE IF NOT EXISTS `user` (
    `id` VARCHAR(255) NOT NULL,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;