import mongoose from 'mongoose';

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
schema.statics.getTopScores = async function(
  guildDiscordId: string,
  limit: number
) {
  // TODO: Implement this method, this is just a placeholder
  return [].slice(0, limit + guildDiscordId.length) as CertainReferralScore[];
};

/**
 * Represents a certain use of an invite by a new guild member
 * for use with invites 3.0
 */
export const CertainReferral = mongoose.model<
  CertainReferralDocument,
  CertainReferralModel
>('Bot-ReferralRanks-CertainReferral', schema);
