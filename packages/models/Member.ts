import mongoose from 'mongoose';

export interface MemberDocument extends mongoose.Document {
  userDiscordId: string;
  guildDiscordId: string;
}

export interface MemberModel extends mongoose.Model<MemberDocument> {}

const schema = new mongoose.Schema({
  userDiscordId: {
    type: String,
    required: true,
  },
  guildDiscordId: {
    type: String,
    required: true,
  },
});

schema.index({ userDiscordId: 1, guildDiscordId: 1 }, { unique: true });

/**
 * The association between a User and a Guild in discord
 */
export const Member = mongoose.model<MemberDocument, MemberModel>(
  'Member',
  schema
);
