import fs from 'fs'
import path from 'path'
import dotenv from 'dotenv'
import express from 'express'
import cors from 'cors'
import mongoose from 'mongoose'
import { Client, Collection, Intents, MessageEmbed } from 'discord.js'
const { Routes } = require('discord-api-types/v9');
import { REST } from '@discordjs/rest'
import { ITeam } from './classes'
import ISlashCommand from './interfaces/SlashCommand'
import responseTime from 'response-time'

/* Pre Processes */
dotenv.config();
mongoose.connect(process.env.DB_URL || "")


/* Main Vars */
const commands_folder = path.join(__dirname, "./commands");
const client_id = process.env.CLIENT_ID;
if (!client_id) throw new Error("Cannot find client id");
const guild_id = process.env.GUILD_ID;
if (!guild_id) throw new Error("Cannot find guild id");
const bot_token = process.env.BOT_TOKEN;
if (!bot_token) throw new Error("Cannot find bot token");

const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MEMBERS] });
const Commands = new Collection<string, ISlashCommand>();

const port = process.env.PORT || 5449;
const app = express();


/* Command Loader */
const commandFiles = fs.readdirSync(commands_folder).filter(file => file.endsWith(__filename.endsWith(".ts") ? '.ts' : '.js'));

for (const file of commandFiles) {
	const command = require(path.join(commands_folder, file)).default;
	Commands.set(command.data.name, command);
}

const rest = new REST({ version: '9' }).setToken(bot_token);

(async () => {
	try {
		console.log('Started refreshing application (/) commands.');

		const jsonCommands = [];
		for (const [id, command] of Commands) {
			jsonCommands.push(command.data.toJSON());
		}

		await rest.put(
			Routes.applicationGuildCommands(client_id, guild_id),
			{ body: jsonCommands },
		);

		console.log('Successfully reloaded application (/) commands.');
	} catch (error) {
		console.error(error);
	}
})();

var lastTime = "";

/* Server Process */
app.use(cors({ origin: '*' }))
app.use(express.json())

app.all('/ping', (req, res) => {
  return res.status(200).send(`Pong!`)
})

app.listen(port, () => {
  console.log(`Server started on port ${port}`);
});


/* Main Process */
client.once('ready', (data) => {
	console.log(`Logged in as "${data.user.tag}"`);

	const refreshCache = async () => {
		const guild = await data.guilds.fetch(guild_id);
		guild.roles.fetch()
		guild.members.fetch()
	}

	refreshCache()
	setInterval(refreshCache, 120000)
});

client.on('interactionCreate', async interaction => {
	if (interaction.isCommand()) {
		const command: ISlashCommand | undefined = Commands.get(interaction.commandName)
		if (!command) return await interaction.reply({embeds: [
			new MessageEmbed().setDescription(`There was an error while executing this command!`).setColor("#ff7675")
		], ephemeral: true})
	
		try {
			await command.run(interaction);
		} catch (err) {
			console.error(err);
			await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
		}
	} else if (interaction.isAutocomplete()) {
		const command: ISlashCommand | undefined = Commands.get(interaction.commandName)
		if (!command) return;
	
		try {
			if (command.autocomplete) await command.autocomplete(interaction);
		} catch (err) {
			console.error(err);
		}
	} else if (interaction.isButton()) {
		const command: ISlashCommand | undefined = Commands.get(interaction.customId.split(";")[0])
		if (!command) return;
	
		try {
			if (command.button) await command.button(interaction);
		} catch (err) {
			console.error(err);
		}
	}
});

client.login(bot_token);
