import { SlashCommandBuilder } from "@discordjs/builders";
import { AutocompleteInteraction, ButtonInteraction, CommandInteraction, MessageEmbed } from "discord.js";
import { FindOptionValue, GuildModel, Members, ParseOptions, ParseSub } from "../utility";

export default {
  data: new SlashCommandBuilder().setName('guild').setDescription("Modify guild properties")
    .addSubcommand(command => command.setName('autoassign').setDescription("Set or remove role which is given to new members")
      .addRoleOption(option => option.setName('role').setDescription("Role to give to new members (Leave blank to disable auto-assign)").setRequired(false)) 
    ),
  
  async run(interaction: CommandInteraction) {
    const guild = interaction.guild
    if (!guild) return await interaction.reply({embeds: [new MessageEmbed().setDescription("Couldn't find guild").setColor("#ff7675")], ephemeral: true})
    if (!interaction.member) return await interaction.reply({embeds: [new MessageEmbed().setDescription("Couldn't find member").setColor("#ff7675")], ephemeral: true})
    const member = await guild.members.fetch(interaction.member.user.id)

    const sub = ParseSub(interaction);
    const opts = ParseOptions(interaction);

    if (!sub.subGroup) {
      if (!opts.subOption) return await interaction.reply({embeds: [new MessageEmbed().setDescription(`An error occurred and some options weren't available`).setColor("#ff7675")], ephemeral: true})
      if (sub.subCommand === "autoassign") {
        if (!Members.IsAdmin(member)) return await interaction.reply({embeds: [
          new MessageEmbed().setDescription(`You do not have permission to use this command`).setColor("#ff7675")
        ], ephemeral: true})
        const RoleID = FindOptionValue<string>(opts.subOption, "role")

        if (!RoleID) {
          await GuildModel.findOneAndUpdate({ id: guild.id }, { $unset: { autoassign: "" } })
          return await interaction.reply({embeds: [
            new MessageEmbed().setDescription(`Disabled auto-assign.`).setColor("#55efc4")
          ], ephemeral: true})
        }

        const role = await guild.roles.fetch(RoleID);
        if (!role) return await interaction.reply({embeds: [new MessageEmbed().setDescription(`That role does not exist`).setColor("#ff7675")], ephemeral: true})
        await GuildModel.findOneAndUpdate({ id: guild.id }, { autoassign: role.id })

        return await interaction.reply({embeds: [
          new MessageEmbed().setDescription(`Added <@&${role.id}> to auto-assign.`).setColor("#55efc4")
        ], ephemeral: true})
      }
    }
  },

  async autocomplete(interaction: AutocompleteInteraction) {},
  async button(interaction: ButtonInteraction) {},
}