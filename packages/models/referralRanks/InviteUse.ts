import mongoose from 'mongoose';

export interface InviteUseDocument extends mongoose.Document {
  guildDiscordId: string;
  userDiscordId: string;
  inviterDiscordId: string;
  uses: number;
}
export interface InviteUseModel extends mongoose.Model<InviteUseDocument> {}

const schema = new mongoose.Schema({
  guildDiscordId: {
    required: true,
    type: String,
  },
  inviterDiscordId: {
    required: true,
    type: String,
  },
  userDiscordId: {
    required: true,
    type: String,
  },
  uses: {
    default: 0,
    required: true,
    type: Number,
  },
});

schema.index({ guildDiscordId: 1, uses: -1 });
schema.index(
  { guildDiscordId: 1, userDiscordId: 1, inviterDiscordId: 1 },
  { unique: true }
);

/**
 * Represents the association between an "inviter" user and an "invited" user
 * through an invite link
 */
export const InviteUse = mongoose.model<InviteUseDocument, InviteUseModel>(
  'Bot-ReferralRanks-InviteUse',
  schema
);
