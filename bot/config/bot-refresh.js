var logger = require('../pkg/logger');
const { REST } = require('@discordjs/rest');
const { SlashCommandBuilder, Routes } = require('discord.js');

// configure commands available to users
const commands = [
    new SlashCommandBuilder().setName('ping').setDescription('Replies with Pong!'),
    new SlashCommandBuilder().setName('enable').setDescription('Enable Chappie'),
    new SlashCommandBuilder().setName('disable').setDescription('Disable Chappie'),
    new SlashCommandBuilder().setName('model').setDescription('Get Chappie\'s model'),
    new SlashCommandBuilder()
        .setName('setmode')
        .setDescription('Set Chappie\'s mode')
        .addStringOption(option =>
            option.setName('mode')
                .setDescription('The mode to use\nAvailable modes: default, sys_admin, juridisk_megler')
                .setRequired(true)),
].map(command => command.toJSON());

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

(async () => {
    try {
        // for guild-based commands
        rest.put(Routes.applicationGuildCommands(process.env.DISCORD_CLIENT_ID, process.env.DISCORD_GUILD_ID), { body: [] })
            .then(() => console.log('Successfully deleted all guild commands.'))
            .catch(console.error);

        // for global commands
        rest.put(Routes.applicationCommands(process.env.DISCORD_CLIENT_ID), { body: [] })
            .then(() => console.log('Successfully deleted all application commands.'))
            .catch(console.error);
        
        console.log('Started refreshing application (/) commands.');

        await rest.put(Routes.applicationGuildCommands(process.env.DISCORD_CLIENT_ID, process.env.DISCORD_GUILD_ID), { body: commands })
            .then((data) => console.log("You installed " + data.length + " commands."))
            .catch((err) => console.log(err));
        console.log('Successfully reloaded application (/) commands.');

    } catch (error) {
        console.error(error);
    }
})();