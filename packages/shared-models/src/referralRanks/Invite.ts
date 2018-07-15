import mongoose from 'mongoose';

export interface InviteDocument extends mongoose.Document {
  guildDiscordId: string;
  inviterDiscordId: string | null;
  code: string;
  uses: number;
}
export interface InviteModel extends mongoose.Model<InviteDocument> {}

const schema = new mongoose.Schema({
  code: {
    required: true,
    type: String,
  },
  guildDiscordId: {
    required: true,
    type: String,
  },
  inviterDiscordId: {
    type: String,
  },
  uses: {
    default: 0,
    type: Number,
  },
});

schema.index({ guildDiscordId: 1 });
schema.index({ code: 1 }, { unique: true });

/**
 * Represents an invite link in a Guild
 */
export const Invite = mongoose.model<InviteDocument, InviteModel>(
  'Bot-ReferralRanks-Invite',
  schema
);
