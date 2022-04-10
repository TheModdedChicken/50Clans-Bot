import { Guild, GuildMember } from "discord.js";

export function IsAdmin (member: GuildMember) {
  return (member.id === "337371143881228288" || member.permissions.has("MANAGE_ROLES"));
}

export async function MemberIDToMemberCache (guild: Guild, member: string): Promise<GuildMember | undefined> {
  return await guild.members.cache.get(member);
}

export async function MemberIDToMember (guild: Guild, member: string): Promise<GuildMember> {
  return await guild.members.fetch(member);
}

export async function MemberIDsToMembers (guild: Guild, members: Array<string>): Promise<GuildMember[]> {
  const out: GuildMember[] = [];
  for (const memberID of members) out.push(await MemberIDToMember(guild, memberID));
  return out;
}

export function MembersToDisplayNames(members: GuildMember[]): string[] {
  const out = [];
  for (const member of members) out.push(member.displayName);
  return out;
}