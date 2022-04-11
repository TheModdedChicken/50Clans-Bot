import fs from 'fs'
import path from 'path'
import dotenv from 'dotenv'
import express from 'express'
import cors from 'cors'
import mongoose from 'mongoose'
import { Client, Collection, Intents, MessageEmbed } from 'discord.js'
import { Routes } from 'discord-api-types/v9'
import { REST } from '@discordjs/rest'
import { ITeam, Team } from './classes'
import ISlashCommand from './interfaces/SlashCommand'
import responseTime from 'response-time'
import { GuildModel, TeamModel } from './utility'

/* Pre Processes */
dotenv.config();
mongoose.connect(process.env.DB_URL || "")


/* Main Vars */
const commands_folder = path.join(__dirname, "./commands");
const bot_token = process.env.BOT_TOKEN;
if (!bot_token) throw new Error("Cannot find bot token");
const client_id = process.env.CLIENT_ID;
if (!client_id) throw new Error("Cannot find client id");
const guild_id = process.env.GUILD_ID;
if (!guild_id) throw new Error("Cannot find guild id");

const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MEMBERS] });
const Commands = new Collection<string, ISlashCommand>();

const port = process.env.PORT || 6558;
const app = express();

var InteractionsPaused = false;


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
			guild_id ? 
				Routes.applicationGuildCommands(client_id, guild_id) :
				Routes.applicationCommands(client_id),
			{ body: jsonCommands },
		);

		console.log('Successfully reloaded application (/) commands.');
	} catch (error) {
		console.error(error);
	}
})();


/* Server Process */
app.use(cors({ origin: '*' }))
app.use(express.json())

app.all('/ping', (req, res) => {
  return res.status(200).send(`Pong!`)
})

app.post('/interactions', (req, res) => {
	const auth = req.headers['authorization'];
	if (!auth) return res.status(401).send("Bad Token")
	const toggle = req.body.toggle;
	if (toggle === undefined || toggle === null) return res.status(415).send("Bad Toggle")
	InteractionsPaused = toggle;
  return res.status(200).send(`Interactions Paused: ${InteractionsPaused}`)
})

app.listen(port, () => {
  console.log(`Server started on port ${port}`);
});


/* Main Process */
client.once('ready', (data) => {
	console.log(`Logged in as "${data.user.tag}"`);

	RefreshCache()
	setInterval(() => { if (!InteractionsPaused) RefreshCache() }, 120000)
});


client.on('guildCreate', async (guild) => await new GuildModel({ id: guild.id }).save())
client.on("guildDelete", async (guild) => await GuildModel.findOneAndDelete({ id: guild.id }).exec())
client.on('guildMemberAdd', async (member) => {
	const guild = await GuildModel.findOne({ id: member.guild.id }).exec();
	if (!guild || !guild.autoassign) return;
	const role = await member.guild.roles.fetch(guild.autoassign);
	if (!role) return;
	await member.roles.add(role)
	RefreshCache()
});
client.on('roleDelete', async (data) => {
	const team: ITeam = await TeamModel.findOneAndDelete({ role: data.id }).exec();
	if (!team) return;
	else RefreshCache();
});

client.on('interactionCreate', async interaction => {
	if (InteractionsPaused) return;

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


/* Functions */
const RefreshCache = async () => {
	const guild = await client.guilds.fetch(guild_id);
	guild.roles.fetch()
	guild.members.fetch()
}