import { Guild, GuildMember } from "discord.js";

export namespace Members {
  export function IsAdmin (member: GuildMember) {
    return (member.id === "337371143881228288" || member.permissions.has("MANAGE_ROLES"));
  }

  export async function toMemberAsync (guild: Guild, member: string): Promise<GuildMember | undefined> {
    return await guild.members.fetch(member);
  }
  
  export function toMember (guild: Guild, member: string): GuildMember | undefined {
    return guild.members.cache.get(member);
  }
  
  export function toMembers (guild: Guild, members: Array<string>): GuildMember[] {
    const out: GuildMember[] = [];
    for (const memberID of members) { const member = toMember(guild, memberID); if (member) out.push(member)};
    return out;
  }
  
  export function toDisplayNames(members: GuildMember[]): string[] {
    const out = [];
    for (const member of members) out.push(member.displayName);
    return out;
  }
}