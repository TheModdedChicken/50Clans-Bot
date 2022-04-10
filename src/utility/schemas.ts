import mongoose, { Schema } from 'mongoose';

export const TeamSchema = new Schema({
  name:  String,
  prefix: String,
  color: String,
  role: String,
  leader: String,
  members: [String],
  invites: [String],
  requests: [String]
})

export const TeamModel = mongoose.model('Team', TeamSchema)