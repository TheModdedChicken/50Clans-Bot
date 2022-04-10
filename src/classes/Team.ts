import { GuildMember } from 'discord.js'
import { ObjectId } from 'mongoose'
import { HexValueRegex, TeamNameRegex, TeamPrefixRegex, TeamModel } from '../utility'

export class Team {
  private _id: ObjectId | undefined
  private name: string
  private prefix: string
  private color: string
  private role: string
  private leader: string
  private members: Array<string>
  private invites: Array<string>
  private requests: Array<string>

  constructor(options: ITeam) {
    this.name = options.name;
    this.prefix = options.prefix;
    this.color = options.color;
    this.role = options.role;
    this.leader = options.leader;
    this.members = options.members;
    this.invites = options.invites;
    this.requests = options.requests;
    if (options._id) this._id = options._id;
  }
  private updateCache(options: ITeam) {
    this.name = options.name;
    this.prefix = options.prefix;
    this.color = options.color;
    this.role = options.role;
    this.leader = options.leader;
    this.members = options.members;
    this.invites = options.invites;
    this.requests = options.requests;
    if (options._id) this._id = options._id;
  }

  async save(): Promise<any> {
    const data = this.getRawData();
    if (this._id) return await TeamModel.findByIdAndUpdate(this._id, data).exec();
    else {
      const team = await new TeamModel(data).save();
      this.updateCache(team);
      return team;
    }
  }

  getRawData(): ITeam {
    return { _id: this._id, name: this.name, prefix: this.prefix, color: this.color, role: this.role, leader: this.leader, members: this.members, invites: this.invites, requests: this.requests }
  }

  async getMongooseData(): Promise<any> {
    if (this._id) return await TeamModel.findById(this._id).exec();
  }

  get getName() { return this.name }
  async setName(name: string) {
    if (!TeamNameRegex.test(name)) throw new Error("Invalid Team Name");
    this.name = name;
    await this.save();
  }

  get getPrefix() { return this.prefix }
  async setPrefix(prefix: string) {
    if (!TeamPrefixRegex.test(prefix)) throw new Error("Invalid Team Prefix");
    this.prefix = prefix;
    await this.save();
  }

  get getColor() { return this.color }
  async setColor(color: string) {
    if (!HexValueRegex.test(color)) throw new Error("Invalid Team Prefix");
    this.color = color;
    await this.save();
  }

  get getRole() { return this.role }
  async setRole(role: string) {
    this.role = role;
    await this.save()
  }

  get getLeader() { return this.leader }
  async setLeader(leader: GuildMember) {
    this.leader = leader.id;
    await this.save()
  }

  /* ~Members~ */
  get getMembers() { return this.members }
  async addMember(member: GuildMember) {
    this.members.push(member.id)
    await TeamModel.findByIdAndUpdate(this._id, { $push: { members: member.id } })
  }
  async removeMember(member: GuildMember) {
    this.members = this.members.filter(m => m !== member.id)
    await TeamModel.findByIdAndUpdate(this._id, { $pull: { members: member.id } })
  }

  /* ~Invites~ */
  get getInvites() { return this.invites }
  async addInvite(member: GuildMember) {
    this.invites.push(member.id)
    await TeamModel.findByIdAndUpdate(this._id, { $push: { invites: member.id } })
  }
  async removeInvite(member: GuildMember) {
    this.invites = this.invites.filter(i => i !== member.id)
    await TeamModel.findByIdAndUpdate(this._id, { $pull: { invites: member.id } })
  }

  /* ~Requests~ */
  get getRequests() { return this.requests }
  async addRequest(member: GuildMember) {
    this.requests.push(member.id)
    await TeamModel.findByIdAndUpdate(this._id, { $push: { requests: member.id } })
  }
  async removeRequest(member: GuildMember) {
    this.requests = this.requests.filter(r => r !== member.id)
    await TeamModel.findByIdAndUpdate(this._id, { $pull: { requests: member.id } })
  }
  
}

export interface ITeam {
  _id?: ObjectId | undefined
  name: string
  prefix: string
  color: string
  role: string
  leader: string
  members: Array<string>
  invites: Array<string>
  requests: Array<string>
}