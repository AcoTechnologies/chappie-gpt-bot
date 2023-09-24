const { query } = require('./engine.js');
const logging = require('../logger');

async function getUser(id) {
    try {
        const queryResult = await query(`
            SELECT *
            FROM users
            WHERE id = $1
        `, [id]);

        return queryResult.rows[0];
    } catch (error) {
        logging.logger.error('Error getting user from database:', error);
        return null;
    }
}

async function addUser(id, username) {
    try {
        // create new user and return it
        const queryResult = await query(`
            INSERT INTO users (id, username)
            VALUES ($1, $2)
            RETURNING *
        `, [id, username]);

        return queryResult.rows[0];

    } catch (error) {
        logging.logger.error('Error adding user to database:', error);
        return null;
    }
}

async function getUserRoles(user_id) {
    try {
        const queryResult = await query(`
            SELECT *
            FROM user_roles
            WHERE user_id = $1
        `, [user_id]);

        return queryResult.rows;
    } catch (error) {
        logging.logger.error('Error getting user roles from database:', error);
        return null;
    }
}

async function getRolePermissions(role_id) { 
    try {
        // join with the permissions table to get the permission names
        const queryResult = await query(`
            SELECT *
            FROM role_permissions
            INNER JOIN permissions
            ON role_permissions.permission_id = permissions.id
            WHERE role_id = $1
        `, [role_id]);

        return queryResult.rows;
    } catch (error) {
        logging.logger.error('Error getting user role permissions from database:', error);
        return null;
    }
}

async function getUserPermissions(user_id) {
    try {
        // join the user_roles table with the role_permissions table, and then the permissions table to get the permission names
        const queryResult = await query(`
            SELECT *
            FROM user_roles
            INNER JOIN role_permissions
            ON user_roles.role_id = role_permissions.role_id
            INNER JOIN permissions
            ON role_permissions.permission_id = permissions.id
            WHERE user_id = $1
        `, [user_id]);

        return queryResult.rows;
    } catch (error) {
        logging.logger.error('Error getting user permissions from database:', error);
        return null;
    }
}

async function checkUserPermission(user_id, permission_name) {
    try {
        // join the user_roles table with the role_permissions table, and then the permissions table to get the permission names
        const queryResult = await query(`
            SELECT *
            FROM user_roles
            INNER JOIN role_permissions
            ON user_roles.role_id = role_permissions.role_id
            INNER JOIN permissions
            ON role_permissions.permission_id = permissions.id
            WHERE user_id = $1
            AND permission_name = $2
        `, [user_id, permission_name]);

        return queryResult.rows.length > 0;
    } catch (error) {
        logging.logger.error('Error checking user permissions from database:', error);
        return null;
    }
}


module.exports = {
    getUser,
    addUser,
    getUserRoles,
    getRolePermissions,
    getUserPermissions,
    checkUserPermission,
};