const logger = require('winston');
const { format } = require('logform');

// configure logger settings
logger.remove(logger.transports.Console);
logger.add(new logger.transports.Console, {
    colorize: true
});
logger.level = 'debug';

module.exports = {
    logger
};