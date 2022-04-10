import { AutocompleteInteraction, CommandInteraction, CommandInteractionOption } from "discord.js";
import { ITeam } from "../classes";
import { ICommandOptions, ICommandSub } from "../interfaces/Interactions";
import { TeamModel } from "./schemas";

export function ParseOptions (interaction: CommandInteraction | AutocompleteInteraction): ICommandOptions {
  const mainOption = interaction.options.data
  const subOption = interaction.options.data[0].options
  // @ts-ignore
  const microOption = interaction.options.data[0].options[0].options

  return {
    // @ts-ignore
    mainOption,
    subOption,
    microOption
  }
}

export function ParseSub (interaction: CommandInteraction | AutocompleteInteraction): ICommandSub {
  const name = interaction.commandName
  var subCommand = ""
  try { subCommand = interaction.options.getSubcommand() } catch {}
  var subGroup = ""
  try { subGroup = interaction.options.getSubcommandGroup() } catch {}

  return {
    name,
    subCommand,
    subGroup
  }
}

export function FindOption (options: CommandInteractionOption[], search: string) {
  return options.find(o => o.name === search)
}

export function FindOptionValue<T extends string | number | boolean> (options: CommandInteractionOption[], search: string): T | undefined {
  const option = FindOption(options, search);
  return option ? option.value as T : undefined
}

export async function GetAllTeams () {
  const teams: ITeam[] = await TeamModel.find().exec();
  const out: {name: string, value: string}[] = []
  for (const team of teams) out.push({name: `${team.prefix} (${team.name})`, value: team.prefix});
  return out;
}