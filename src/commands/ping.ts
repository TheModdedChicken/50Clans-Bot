import { SlashCommandBuilder } from "@discordjs/builders";
import { CommandInteraction } from "discord.js";

export default {
  data: new SlashCommandBuilder().setName('ping').setDescription("Check the bot's ping"),
  
  async command(interaction: CommandInteraction) {
    const time = new Date().getTime() - interaction.createdAt.getTime();
    interaction.reply(`Pong! (${time}ms)`);
  }
}