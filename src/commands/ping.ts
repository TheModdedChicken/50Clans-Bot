import { SlashCommandBuilder } from "@discordjs/builders";
import { AutocompleteInteraction, ButtonInteraction, CommandInteraction } from "discord.js";

export default {
  data: new SlashCommandBuilder().setName('ping').setDescription("Check the bot's ping"),
  
  async run(interaction: CommandInteraction) {
    const time = new Date().getTime() - interaction.createdAt.getTime();
    interaction.reply(`Pong! (${time}ms)`);
  },

  async autocomplete(interaction: AutocompleteInteraction) {},
  async button(interaction: ButtonInteraction) {},
}