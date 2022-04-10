import { CommandInteractionOption } from "discord.js";

export interface ICommandOptions {
  readonly mainOption: CommandInteractionOption[] | undefined
  subOption: CommandInteractionOption[] | undefined
  microOption: CommandInteractionOption[] | undefined
}

export interface ICommandSub {
  name: string
  subCommand: string | undefined
  subGroup: string | undefined
}