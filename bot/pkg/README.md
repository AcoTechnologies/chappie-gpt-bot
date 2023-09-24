# Bot Package (`bot/pkg/`)

This folder contains various packages/modules used by your bot to perform different functions. Below is an overview of the key modules within this package and their purposes.

## Logger (`logger.js`)

The `logger.js` module is responsible for setting up and configuring the bot's logging functionality using the Winston library. It provides a logging object that you can use throughout your code to log different levels of messages.

### Example Usage:

```javascript
const { logger } = require('./logger.js');

// Log messages with different severity levels
logger.debug('Debug message');
logger.info('Informational message');
logger.error('Error message');
```

## Chat (`chat.js`)

The `chat.js` module handles incoming messages and manages chat sessions. It interacts with the database to store and retrieve chat messages, user information, and session data. This module also contains a function to check if the bot is mentioned in a message and handles chat interactions with users.

### Example Usage:

```javascript
const { chatHandler } = require('./chat.js');

// Define the bot's name and model
const botName = 'YourBotName';
const botModel = 'YourBotModel';

// Handle incoming message events
client.on('messageCreate', (msgEvent) => {
    chatHandler(msgEvent, botName, botModel);
});
```

## Commands (`commands.js`)

The `commands.js` module manages slash commands and their associated actions. It handles interactions with users by verifying permissions, updating session states, and executing commands based on user input.

### Example Usage:

```javascript
const { slashCommandHandler } = require('./commands.js');

// Handle incoming slash commands
client.on('interactionCreate', async (interaction) => {
    if (!interaction.isCommand()) return;

    slashCommandHandler(interaction);
});
```

## OpenAI Request (`openai-request.js`)

The `openai-request.js` module interacts with the OpenAI API to generate responses to user messages. It handles sending requests to the API, processing responses, and sending replies to the user. Additionally, it manages responses that exceed Discord's character limit.

### Example Usage:

```javascript
const { chat } = require('./openai-request.js');

// Example usage within the chat handler
chat(msgEvent, botModel, botContext);
```

Please replace placeholders like `'YourBotName'`, `'YourBotModel'`, and other configurations with your actual bot's information and configurations. The provided examples illustrate how to use these modules in your bot's code.
