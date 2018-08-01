import {
  BOT_TYPES,
  REFERRAL_RANKS_DEFAULT_LEADERBOARD_SIZE,
} from '@overmindbots/shared-utils/constants';
import Discord from 'discord.js';
import { map } from 'lodash';
import mongoose from 'mongoose';

import { BotInstance } from '../BotInstance';

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
    guild: Discord.Guild,
    limit?: number
  ): Promise<CertainReferralScore[]>;
}
export interface CertainReferralScore {
  inviterDiscordId: string;
  score: number;
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
  limit: number = REFERRAL_RANKS_DEFAULT_LEADERBOARD_SIZE
) {
  const {
    config: { countScoresSince },
  } = await BotInstance.findOrCreate(guild, BOT_TYPES.REFERRAL_RANKS);

  // If countScoresSince is not define, query from the beginning of time
  const getScoresSince = countScoresSince || new Date(0);

  const scores = (await CertainReferral.aggregate([
    {
      $match: {
        guildDiscordId: guild.id,
        timestamp: { $gte: getScoresSince.getTime() },
        fulfilled: true,
      },
    },
    {
      $group: {
        _id: '$inviterDiscordId',
        score: { $sum: 1 },
      },
    },
    { $limit: limit },
  ])) as Array<{ _id: string; score: number }>;

  return map(scores, ({ score, _id }) => ({
    inviterDiscordId: _id,
    score,
  }));
};

/**
 * Represents a certain use of an invite by a new guild member
 * for use with invites 3.0
 */
export const CertainReferral = mongoose.model<
  CertainReferralDocument,
  CertainReferralModel
>('Bot-ReferralRanks-CertainReferral', schema);
