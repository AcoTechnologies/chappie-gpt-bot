# Chappie

Chappie GPT Discord bot is a fun discord bot member with personality.
It uses OpenAI API and Discord service worker to simulate a fun member of your discord channel.

<b>It so far has these commands</b>
- /ping
- /enable
- /disable
- /model
- /setmodel

It sends plain message content embedded into a completion prompt to openai GPT3 davinci completion model.
The reply is then sent to the same channel as the message.

## Installation, Usage

To run this bot you need two json files 

containing configuration for

- openai account
- discord bot secrets

you also need node.js installed

Commands to run:

```bash
yarn install
```

```bash
yarn run
```