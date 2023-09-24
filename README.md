# Chappie - A Personality-Driven Discord Bot Powered by OpenAI GPT

Chappie is an interactive Discord bot that brings personality and fun to your Discord channel. It leverages the OpenAI API and Discord service worker to provide engaging and dynamic interactions within your server.

## Features

Chappie offers a growing list of commands and features to enhance your Discord server experience:

- **/ping**: Test the bot's responsiveness with a simple ping-pong interaction.
- **/enable**: Activate Chappie to start responding to messages in your channel.
- **/disable**: Deactivate Chappie when you need some peace and quiet.
- **/model**: Check the current AI model Chappie is using.
- **/setmodel**: Change Chappie's AI model to suit your preferences.

## Getting Up and Running

To run Chappie on your own server, follow these steps:

## Installation and Usage

### Codespace
#### Prerequisites

Before getting started, make sure you have the following:

- OpenAI account with API credentials.
- Discord bot token and secrets.
- Visual Studio Code (VSCode) (optional).
- or VSCode extension - Github Codespaces (optional).

1. Click the "Code" button at the top of this repository and select "Codespaces" to launch a new Codespace.

2. Once it has started, in the terminal, provide the prompted information to the postCreateCommand procedure.
*Note: If you started codespace in the browser, this automation is faulty, then you need to fill in the .devcontainer/devcontainer.env directly and "rebuild contianer"*

3. Start the bot by running the following command in the terminal:

   \```bash
   bun start
   \```

   This will launch Chappie using "bun" as the backend.


### local installation
#### Prerequisites

Before getting started, make sure you have the following:

- OpenAI account with API credentials.
- Discord bot token and secrets.
- Visual Studio Code (VSCode).
- Docker installed.
- VSCode extension - Dev Container.

1. Clone this repository to your local machine, and open VSCode.
```bash
git clone https://github.com/WebRodent/chappie-gpt-bot.git && cd chappie-gpt-bot && code .
```

3. Open the project in dev container by clicking the "Reopen in Container" button in the bottom right user prompted window.
or by opening the command palette (Ctrl+Shift+P) and selecting "Dev Contaienr: Reopen in Container".

4. Start the bot by running the following command in the terminal:

```bash
bun start
```

This will launch Chappie using "bun" as the backend.

5. Chappie will now be up and running, ready to join your Discord server.


## additional database scripts in package.json

The database is setup automatically if you complete the "Getting Up and Running" steps above.
But while working on your environmnt you may need to run some of the following scripts:

### db-init
This script will populate the database with the necessary data for your initial dev environment to work.
```bash
bun db-init
```

### db-rebuild
This script will drop each of the tables in the "bot" database and reinitialize them, then populate the database with the necessary data for your initial dev environment to work.
so it performs (drop tables), (create tables), (same as in db-init).
```bash
bun db-rebuild
```

## Contributing

We welcome contributions to make Chappie even better! If you have ideas for new features, improvements, or bug fixes, please open an issue or submit a pull request.

## License

This project is licensed under the BSD 2-Clause License. See the [BSD 2-Clause License](./LICENSE) file for details.

## Acknowledgments

Chappie is built using the power of OpenAI's GPT models and the Discord.js library. We thank these communities for their amazing work.

---

Enjoy the company of Chappie in your Discord server and have fun engaging with this personality-driven bot!
