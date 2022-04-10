import { SlashCommandBuilder } from "@discordjs/builders";
import { AutocompleteInteraction, ButtonInteraction, CommandInteraction } from "discord.js";

export default interface ISlashCommand {
  data: SlashCommandBuilder
  run: (interaction: CommandInteraction) => Promise<void>
  autocomplete?: (interaction: AutocompleteInteraction) => Promise<void>
  button?: (interaction: ButtonInteraction) => Promise<void>
}