import mongoose from 'mongoose';
import Discord from 'discord.js';

export interface CertainReferralDocument extends mongoose.Document {
  guildDiscordId: string;
  inviterDiscordId: string | null;
  inviteeDiscordId: string;
  timestamp: number;
  fulfilled: boolean;
}
export interface CertainReferralModel
  extends mongoose.Model<CertainReferralDocument> {
  getTopScores(
    guildDiscordId: string,
    limit?: number
  ): Promise<CertainReferralScore[]>;
}
export interface CertainReferralScore {
  inviterDiscordId: string;
  score: number;
  username: string;
}

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
  fulfilled: {
    required: true,
    type: Boolean,
  },
});

schema.index({ guildDiscordId: 1 });
schema.index(
  { guildDiscordId: 1, inviterDiscordId: 1, inviteeDiscordId: 1 },
  { unique: true }
);
/**
 * Gets a list of the members of a guild with higher scores in descending order
 * since the last invites reset date
 */
schema.statics.getTopScores = async function(
  guild: Discord.Guild,
  limit: number
) {
  // TODO: Implement
};

/**
 * Represents a certain use of an invite by a new guild member
 * for use with invites 3.0
 */
export const CertainReferral = mongoose.model<
  CertainReferralDocument,
  CertainReferralModel
>('Bot-ReferralRanks-CertainReferral', schema);
