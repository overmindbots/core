import mongoose from 'mongoose';

export interface ReferralDocument extends mongoose.Document {
  guildDiscordId: string;
  inviterDiscordId: string | null;
  inviteeDiscordId: string;
  timestamp: number;
  certainty: number;
}
export interface ReferralModel extends mongoose.Model<ReferralDocument> {}

const schema = new mongoose.Schema({
  guildDiscordId: {
    required: true,
    type: String,
  },
  inviterDiscordId: {
    type: String,
  },
  inviteeDiscordId: {
    required: true,
    type: String,
  },
  timestamp: {
    required: true,
    type: Number,
  },
  certainty: {
    required: true,
    type: Number,
  },
});

schema.index({ guildDiscordId: 1 });
schema.index({ guildDiscordId: 1, inviterDiscordId: 1, inviteeDiscordId: 1 });

/**
 * Represents a possible use of an invite by a new guild member
 */
export const Referral = mongoose.model<ReferralDocument, ReferralModel>(
  'Bot-ReferralRanks-Referral',
  schema
);
