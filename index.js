const { Client, GatewayIntentBits, Partials, Collection } = require('discord.js');
const { Guilds, GuildMembers, GuildMessages, GuildEmojisAndStickers, MessageContent } = GatewayIntentBits;
const { User, Message, GuildMember, ThreadMember, Channel } = Partials;
const { loadEvents } = require('./Handlers/eventHandler');
const { loadCommands } = require('./Handlers/commandHandler');
const { EmbedBuilder } = require('@discordjs/builders');

const client = new Client({
    intents: [Guilds, GuildMembers, GuildMessages, GuildEmojisAndStickers, MessageContent],
    partials: [User, Message, GuildMember, ThreadMember],
});

client.commands = new Collection();
client.config = require('./config.json');

client.login(client.config.token).then(() => {
    loadEvents(client);
    loadCommands(client);
});