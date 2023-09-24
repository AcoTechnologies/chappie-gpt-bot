# Bot Database Handlers

This folder contains a series of database handlers used for managing the PostgreSQL database of the bot.

## Files and Their Usage

### `engine.js`

- **Description:** Database handler for the bot's PostgreSQL database.
- **Usage:** This module exports functions for executing SQL queries and managing database connections.

### `messages.js`

- **Description:** Handles adding messages to the database and retrieving messages.
- **Usage:** This module provides functions for adding messages to the database, updating chat sessions, and retrieving chat messages. It also includes functions for formatting messages for OpenAI chat completion models.

### `presets.js`

- **Description:** Handles retrieving bot presets from the database.
- **Usage:** This module exports a function for fetching bot presets by name from the database.

### `sessions.js`

- **Description:** Manages guild sessions in the database.
- **Usage:** This module exports functions for getting, adding, and updating guild sessions. It also sets the default bot preset for new sessions.

### `users.js`

- **Description:** Manages user-related data in the database.
- **Usage:** This module exports functions for getting user data, adding users, retrieving user roles and permissions, and checking user permissions.

## Example Usage

Here's an example of how to use these database handlers in your bot's code:

```javascript
// Import the necessary database handlers
const { getUser } = require('./database/users');
const { getGuild } = require('./database/guilds');
const { getSession } = require('./database/sessions');
const { getMessages, addMessage } = require('./database/messages');

// Example: Get a user by user ID
const userId = 123; // Replace with the user's actual ID
const user = await getUser(userId);
console.log('User:', user);

// Example: Get a guild by guild ID
const guildId = 'your-guild-id'; // Replace with the guild's actual ID
const guild = await getGuild(guildId);
console.log('Guild:', guild);

// Example: Get a guild session by guild ID and channel ID
const channelId = 'your-channel-id'; // Replace with the channel's actual ID
const session = await getSession(guildId, channelId);
console.log('Guild Session:', session);

// Example: Retrieve the last chat messages for a guild session
const limit = 10; // Replace with the desired number of messages to retrieve
const messages = await getMessages(limit, session.id);
console.log('Last Chat Messages:', messages);

// Example: Add a new message to the database
const messageContent = 'Hello, bot!'; // Replace with the message content
const botMentioned = true; // Replace with whether the bot was mentioned in the message
const [newMessage, timerBypass] = await addMessage(session, user, messageContent, botMentioned);
console.log('New Message:', newMessage);
console.log('Timer Bypass:', timerBypass);
```
