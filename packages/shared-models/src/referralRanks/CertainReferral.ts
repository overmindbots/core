import {
  BOT_TYPES,
  DISCORD_BIG_GUILD_MEMBER_SIZE,
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
  imported: boolean;
  fulfilled: boolean;
  createdAt: Date;
  updatedAt: Date;
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
  username: string;
}

const schema = new mongoose.Schema(
  {
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
    active: {
      required: true,
      type: Boolean,
    },
    fulfilled: {
      required: true,
      type: Boolean,
    },
    imported: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

schema.index({ guildDiscordId: 1 });
schema.index(
  { guildDiscordId: 1, inviterDiscordId: 1, inviteeDiscordId: 1 },
  { unique: true }
);
schema.index({ createdAt: 1 });

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
        createdAt: { $gte: getScoresSince },
        fulfilled: true,
      },
    },
    {
      $group: {
        _id: '$inviterDiscordId',
        score: { $sum: 1 },
      },
    },
    { $sort: { score: -1 } },
    { $limit: limit },
  ])) as Array<{ _id: string; score: number }>;

  if (scores.length <= 0) {
    return scores;
  }

  // TODO: Make sure future requests are  automatically avoided and member cache
  // is updated, otherwise, prevent unnecessary fetches
  if (guild.memberCount >= DISCORD_BIG_GUILD_MEMBER_SIZE) {
    await guild.fetchMembers();
  }

  return map(scores, ({ score, _id }) => {
    const member = guild.members.get(_id);
    const username = (member && member.displayName) || 'Delete User';
    return {
      inviterDiscordId: _id,
      username,
      score,
    };
  });
};

/**
 * Represents a certain use of an invite by a new guild member
 * for use with invites 3.0
 */
export const CertainReferral = mongoose.model<
  CertainReferralDocument,
  CertainReferralModel
>('Bot-ReferralRanks-CertainReferral', schema);
