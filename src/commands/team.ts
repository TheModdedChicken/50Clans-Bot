import { SlashCommandBuilder } from "@discordjs/builders";
import { AutocompleteInteraction, ButtonInteraction, CommandInteraction, GuildMember, MessageEmbed } from "discord.js";
import { ITeam, Team } from "../classes";
import { ParseSub, ParseOptions, TeamNameRegex, TeamPrefixRegex, HexValueRegex, TeamModel, Members, GetAllTeams, FindOption, FindOptionValue } from "../utility";

export default {
  data: new SlashCommandBuilder().setName('team').setDescription("Create, Modify, and Delete Teams")
    .addSubcommand(command => command.setName('create').setDescription("Create a new team") /* ~team/create */
      .addStringOption(option => option.setName('name').setDescription("Name of new team (3-30 Characters Only)").setRequired(true))
      .addStringOption(option => option.setName('prefix').setDescription("Prefix of new team (2-5 Characters Only)").setRequired(true))
      .addStringOption(option => option.setName('color').setDescription("Color of new team (Color Name or Hex Value)").setAutocomplete(true).setRequired(false))
    )
    .addSubcommand(command => command.setName('delete').setDescription("Delete a team (Leader Only)") /* ~team/delete */
      .addStringOption(option => option.setName('team').setDescription("Prefix of team to delete").setAutocomplete(true).setRequired(true))
    )
    .addSubcommand(command => command.setName('list').setDescription("List details of current teams") /* ~team/list */
      .addStringOption(option => option.setName('team').setDescription("Prefix of team to list details of").setAutocomplete(true).setRequired(false))
    )
    .addSubcommand(command => command.setName('sync').setDescription("Sync teams, roles, and members") /* ~team/list */
      .addUserOption(option => option.setName('user').setDescription("User to sync teams and roles to").setRequired(false))
    )
    .addSubcommandGroup(group => group.setName('modify').setDescription("Modify properties of a team") /* ~team/modify */
      .addSubcommand(command => command.setName('name').setDescription("Modify the name of a team (Leader Only)") /* ~team/modify/name */
        .addStringOption(option => option.setName('team').setDescription("Prefix of team to change the name of").setAutocomplete(true).setRequired(true))
        .addStringOption(option => option.setName('name').setDescription("New name for team (3-30 Characters Only)").setRequired(true))
      )
      .addSubcommand(command => command.setName('prefix').setDescription("Modify the prefix of a team (Leader Only)") /* ~team/modify/prefix */
        .addStringOption(option => option.setName('team').setDescription("Prefix of team to change the prefix of").setAutocomplete(true).setRequired(true))
        .addStringOption(option => option.setName('prefix').setDescription("New prefix for team (2-5 Characters Only)").setRequired(true))
      )
      .addSubcommand(command => command.setName('color').setDescription("Modify the color of a team (Leader Only)") /* ~team/modify/color */
        .addStringOption(option => option.setName('team').setDescription("Prefix of team to change the color of").setAutocomplete(true).setRequired(true))
        .addStringOption(option => option.setName('color').setDescription("New color for team (Color Name or Hex Value)").setAutocomplete(true).setRequired(true))
      )
      .addSubcommand(command => command.setName('leader').setDescription("Modify the leader of a team (Leader Only)") /* ~team/modify/leader */
        .addStringOption(option => option.setName('team').setDescription("Prefix of team to change the color of").setAutocomplete(true).setRequired(true))
        .addStringOption(option => option.setName('leader').setDescription("New leader for team").setAutocomplete(true).setRequired(true))
      )
    )
    .addSubcommandGroup(group => group.setName('member').setDescription("Modify properties of a team") /* ~team/modify */
      .addSubcommand(command => command.setName('add').setDescription("Add a user to a team (Admins Only)") /* ~team/modify/name */
        .addStringOption(option => option.setName('team').setDescription("Prefix of team to add the user to").setAutocomplete(true).setRequired(true))
        .addUserOption(option => option.setName('user').setDescription("User to add to team").setRequired(true))
        .addBooleanOption(option => option.setName('force').setDescription("When set to true this command will ignore restrictions such as a user already being on a team.").setRequired(false))
      )
      .addSubcommand(command => command.setName('revoke').setDescription("Revoke a membership or invite to a team (Leader Only)") /* ~team/modify/prefix */
        .addStringOption(option => option.setName('team').setDescription("Prefix of team to revoke membership of user from").setAutocomplete(true).setRequired(true))
        .addStringOption(option => option.setName('user').setDescription("User to revoke membership from").setAutocomplete(true).setRequired(true))
      )
      .addSubcommand(command => command.setName('invite').setDescription("Invite a user to a team (Leader Only)") /* ~team/modify/color */
        .addStringOption(option => option.setName('team').setDescription("Prefix of team to invite user to").setAutocomplete(true).setRequired(true))
        .addUserOption(option => option.setName('user').setDescription("User to invite to team").setRequired(true))
      )
      .addSubcommand(command => command.setName('join').setDescription("Request to join a team") /* ~team/modify/leader */
        .addStringOption(option => option.setName('team').setDescription("Prefix of team to join").setAutocomplete(true).setRequired(true))
      )
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
      if (sub.subCommand === "create") {
        const MemberCheck: ITeam = await TeamModel.findOne({ members: member.id }).exec()
        if (MemberCheck && !Members.IsAdmin(member)) return await interaction.reply({embeds: [
          new MessageEmbed().setDescription(`You're already on team "${MemberCheck.name}". Please leave it to create a new one.`).setColor("#ff7675")
        ], ephemeral: true})

        var TeamName = FindOptionValue<string>(opts.subOption, "name")
        var TeamPrefix = FindOptionValue<string>(opts.subOption, "prefix")
        var TeamColor = FindOptionValue<string>(opts.subOption, "color")

        if (!TeamName || !TeamNameRegex.test(TeamName)) return await interaction.reply({embeds: [
          new MessageEmbed().setDescription("Invalid Team Name").setColor("#ff7675")
        ], ephemeral: true})

        if (!TeamPrefix || !TeamPrefixRegex.test(TeamPrefix)) return await interaction.reply({embeds: [
          new MessageEmbed().setDescription("Invalid Team Prefix").setColor("#ff7675")
        ], ephemeral: true})
        const TeamPrefixCheck: ITeam = await TeamModel.findOne({ prefix: TeamPrefix }).exec()
        if (TeamPrefixCheck) return await interaction.reply({embeds: [
          new MessageEmbed().setDescription(`Team ${TeamPrefixCheck.name} is already using this prefix. Please choose a different one.`).setColor("#ff7675")
        ], ephemeral: true})

        if (!TeamColor) TeamColor = "#ffffff"
        if (!HexValueRegex.test(TeamColor)) return await interaction.reply({embeds: [
          new MessageEmbed().setDescription("Invalid Hex Value").setColor("#ff7675")
        ], ephemeral: true})

        const newRole = await guild.roles.create({ name: `${TeamPrefix} (${TeamName})`, color: `#${TeamColor.replace("#", "")}`, position: 3 });
        member.roles.add(newRole);
        const newTeam = new Team({ 
          name: TeamName,
          prefix: TeamPrefix,
          color: TeamColor,
          role: newRole.id,
          leader: member.id,
          members: [member.id],
          invites: [],
          requests: []
        });
        await newTeam.save();

        await interaction.reply({embeds: [
          new MessageEmbed().setTitle(`Created team "${newTeam.getName}"`).setColor("#55efc4").addFields([
            { name: "Role", value: `<@&${newRole.id}>` },
            { name: "Prefix", value: newTeam.getPrefix },
            { name: "Color", value: newTeam.getColor },
            { name: "Leader", value: member.displayName },
            { name: "Members", value: Members.toDisplayNames(Members.toMembers(guild, newTeam.getMembers)).toString().replace(",", "\n") }
          ])
        ], ephemeral: true})
      } else if (sub.subCommand === "delete") {
        var TeamPrefix = FindOptionValue<string>(opts.subOption, "team")
        const team: ITeam = await TeamModel.findOne({ prefix: TeamPrefix }).exec()
        if (!team) return await interaction.reply({embeds: [
          new MessageEmbed().setDescription(`No team with the prefix "${TeamPrefix}" exists.`).setColor("#ff7675")
        ], ephemeral: true})

        if (team.leader !== member.id && !Members.IsAdmin(member)) return await interaction.reply({embeds: [
          new MessageEmbed().setDescription(`You are not the leader of this team.`).setColor("#ff7675")
        ], ephemeral: true})

        guild.roles.delete(team.role, `Team "${team.name}" was deleted by **${member.user.tag}**`)
        await TeamModel.findOneAndDelete({ prefix: TeamPrefix }).exec()

        await interaction.reply({embeds: [
          new MessageEmbed().setDescription(`Deleted team "${team.name}"`).setColor("#55efc4")
        ], ephemeral: true})
      } else if (sub.subCommand === "list") {
        var TeamPrefix = FindOptionValue<string>(opts.subOption, "team")
        if (TeamPrefix) {
          const team: ITeam = await TeamModel.findOne({ prefix: TeamPrefix }).exec()
          if (!team) return await interaction.reply({embeds: [new MessageEmbed().setDescription(`No team with the prefix ${TeamPrefix} exists.`).setColor("#ff7675")], ephemeral: true})
          const out = new MessageEmbed().setTitle(`${team.name} # ${team.prefix}`).setColor("#55efc4").addFields([
            { name: "Role", value: `<@&${team.role}>` },
            { name: "Leader", value: (Members.toMember(guild, team.leader) as GuildMember).displayName || "Error" },
            { name: "Members", value: Members.toDisplayNames(Members.toMembers(guild, team.members)).toString().split(',').join('\n') }
          ])
          interaction.reply({ embeds:[out] })
        } else {
          const teams: ITeam[] = await TeamModel.find().exec();
          const out = new MessageEmbed().setTitle(`All Teams`).setColor("#55efc4")
          for (const team of teams) out.addField(
            `${team.name} # ${team.prefix}`,
            Members.toDisplayNames(Members.toMembers(guild, team.members)).toString().split(',').join('\n')
          );
          interaction.reply({ embeds:[out] })
        }
      } else if (sub.subCommand === "sync") {

      }
    } else if (sub.subGroup === "modify") {
      
    } else if (sub.subGroup === "member") {
      if (!opts.microOption) return await interaction.reply({embeds: [new MessageEmbed().setDescription(`An error occurred and some options weren't available`).setColor("#ff7675")], ephemeral: true})
      if (sub.subCommand === "add") {
        if (!Members.IsAdmin(member)) return await interaction.reply({embeds: [
          new MessageEmbed().setDescription(`You do not have permission to use this command`).setColor("#ff7675")
        ], ephemeral: true})

        const TeamPrefix = FindOptionValue<string>(opts.microOption, "team")
        const UserID = FindOptionValue<string>(opts.microOption, "user")
        const force = FindOptionValue<boolean>(opts.microOption, "force")

        if (!UserID) return await interaction.reply({embeds: [new MessageEmbed().setDescription(`Invalid User`).setColor("#ff7675")], ephemeral: true})
        const team: ITeam = await TeamModel.findOne({ prefix: TeamPrefix }).exec()
        if (!team) return await interaction.reply({embeds: [
          new MessageEmbed().setDescription(`No team exists with the prefix "${TeamPrefix}"`).setColor("#ff7675")
        ], ephemeral: true})

        if (team.members.includes(UserID) && !force) return await interaction.reply({embeds: [
          new MessageEmbed().setDescription(`This user is already a member of "${team.name}"`).setColor("#ff7675")
        ], ephemeral: true})

        const memberScope = await guild.members.fetch(UserID);
        await memberScope.roles.add(team.role, `${memberScope.user.tag} was added to team "${team.name}" by <@&${member.user.tag}>`)
        await TeamModel.findOneAndUpdate({ prefix: TeamPrefix }, { $push: { members: memberScope.id } }).exec()

        return await interaction.reply({embeds: [
          new MessageEmbed().setDescription(`Added <@${memberScope.id}> to team ${team.name}.`).setColor("#55efc4")
        ], ephemeral: true})
      } else if (sub.subCommand === "revoke") {
        const TeamPrefix = FindOptionValue<string>(opts.microOption, "team")
        const UserID = FindOptionValue<string>(opts.microOption, "user") || ""

        const team: ITeam = await TeamModel.findOne({ prefix: TeamPrefix }).exec()
        if (!team) return await interaction.reply({embeds: [
          new MessageEmbed().setDescription(`No team with the prefix ${TeamPrefix} exists.`).setColor("#ff7675")
        ], ephemeral: true});

        if (member.id !== team.leader && !Members.IsAdmin(member)) return await interaction.reply({embeds: [
          new MessageEmbed().setDescription(`You are not the leader of team "${team.name}"`).setColor("#ff7675")
        ], ephemeral: true})

        if (team.members.includes(UserID)) {
          const memberScope = await guild.members.fetch(UserID);
          if (team.leader === UserID) return await interaction.reply({embeds: [
            new MessageEmbed().setDescription(`You cannot kick the leader of a team.`).setColor("#ff7675")
          ], ephemeral: true});

          await memberScope.roles.remove(team.role, `${memberScope.user.tag} had their membership to team "${team.name}" revoked by ${member.user.tag}.`);
          await TeamModel.findOneAndUpdate({ prefix: TeamPrefix }, { $pull: { members: memberScope.id } })
        } else if (team.invites.includes(UserID)) {
          const memberScope = await guild.members.fetch(UserID);
          await TeamModel.findOneAndUpdate({ prefix: TeamPrefix }, { $pull: { invites: memberScope.id } })
        } else return await interaction.reply({embeds: [
          new MessageEmbed().setDescription(`This user does not have any membership status in team "${team.name}"`).setColor("#ff7675")
        ], ephemeral: true});

        return await interaction.reply({embeds: [
          new MessageEmbed().setDescription(`Revoked <@${UserID}>'s membership to team "${team.name}".`).setColor("#55efc4")
        ], ephemeral: true})
      } else if (sub.subCommand === "invite") {
        /*var TeamPrefix = FindOptionValue<string>(opts.microOption, "team")
        var UserID = FindOptionValue<string>(opts.microOption, "user")

        if (!UserID) return await interaction.reply({embeds: [new MessageEmbed().setDescription(`Invalid User`).setColor("#ff7675")], ephemeral: true})
        const team: ITeam = await TeamModel.findOne({ prefix: TeamPrefix }).exec()
        if (!team) return await interaction.reply({embeds: [
          new MessageEmbed().setDescription(`No team exists with the prefix "${TeamPrefix}"`).setColor("#ff7675")
        ], ephemeral: true})*/
      }
    }
  },

  async autocomplete(interaction: AutocompleteInteraction) {
    const guild = interaction.guild
    if (!guild) return;
    //const member = await guild.members.fetch(interaction.member.user.id)
    //if (!member) return;

    const sub = ParseSub(interaction);
    const opts = ParseOptions(interaction);

    if (!sub.subGroup) {
      if (!opts.subOption) return;
      else if (sub.subCommand === "create") return interaction.respond(colors);
      else if (sub.subCommand === "delete") return interaction.respond(await GetAllTeams());
      else if (sub.subCommand === "list") return interaction.respond(await GetAllTeams());
    } else if (sub.subGroup === "modify") {

    } else if (sub.subGroup === "member") {
      if (!opts.microOption) return;
      if (sub.subCommand === "add") return interaction.respond(await GetAllTeams());
      if (sub.subCommand === "revoke") {
        const prefix = FindOptionValue<string>(opts.microOption, "team")
        const user = FindOptionValue<string>(opts.microOption, "user")

        if (!prefix) return interaction.respond(await GetAllTeams());
        else if (!user) {
          const team: ITeam = await TeamModel.findOne({ prefix }).exec();
          const out: {name: string, value: string}[] = [];
          for (const MemberID of team.members) {
            const member = Members.toMember(guild, MemberID);
            if (member) out.push({name: `${member.displayName}${team.leader === member.id ? " (Leader)" : ""}`, value: member.id})
          }
          return interaction.respond(out);
        }
      }
    }
  },
  async button(interaction: ButtonInteraction) {},
}

const colors: {name: string, value: string}[] = [
  {name: "black", value: "#000000"},
  {name: "silver", value: "#c0c0c0"},
  {name: "gray", value: "#808080"},
  {name: "white", value: "#ffffff"},
  {name: "maroon", value: "#800000"},
  {name: "red", value: "#ff0000"},
  {name: "purple", value: "#800080"},
  {name: "fuchisa", value: "#ff00ff"},
  {name: "green", value: "#008000"},
  {name: "lime", value: "#00ff00"},
  {name: "olive", value: "#808000"},
  {name: "yellow", value: "#ffff00"},
  {name: "navy", value: "#000080"},
  {name: "blue", value: "#0000ff"},
  {name: "teal", value: "#008080"},
  {name: "aqua", value: "#00ffff"},
]