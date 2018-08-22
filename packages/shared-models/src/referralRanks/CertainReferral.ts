import {
  BOT_TYPES,
  DISCORD_BIG_GUILD_MEMBER_SIZE,
  REFERRAL_RANKS_DEFAULT_LEADERBOARD_SIZE,
} from '@overmindbots/shared-utils/constants';
import Discord from 'discord.js';
import { compact, difference, map, reduce } from 'lodash';
import mongoose from 'mongoose';

import { BotInstance } from '../BotInstance';

export interface CertainReferralDocument extends mongoose.Document {
  guildDiscordId: string;
  inviterDiscordId?: string;
  inviteeDiscordId?: string;
  fulfilled: boolean;
  createdAt: Date;
  updatedAt: Date;
  artificial?: boolean;
  count: number;
}
export interface CertainReferralModel
  extends mongoose.Model<CertainReferralDocument> {
  getTopScores(
    guild: Discord.Guild,
    limit?: number
  ): Promise<CertainReferralScore[]>;
  getMemberScore(member: Discord.GuildMember, since: Date): Promise<number>;
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
    artificial: {
      type: Boolean,
    },
    // Useful for artificial invites to avoid creating multiple records
    count: {
      required: true,
      type: Number,
      default: 1,
    },
  },
  { timestamps: true }
);

schema.index({ guildDiscordId: 1 });
schema.index({ artificial: 1 });
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
  this: CertainReferralModel,
  guild: Discord.Guild,
  limit: number = REFERRAL_RANKS_DEFAULT_LEADERBOARD_SIZE
) {
  const {
    config: { countScoresSince },
  } = await BotInstance.findOrCreate(guild, BOT_TYPES.REFERRAL_RANKS);

  // If countScoresSince is not define, query from the beginning of time
  const getScoresSince = countScoresSince || new Date(0);

  const scores = (await this.aggregate([
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
        score: { $sum: '$count' },
      },
    },
    { $sort: { score: -1 } },
    { $limit: limit },
  ])) as Array<{ _id: string; score: number }>;

  if (scores.length <= 0) {
    return scores;
  }

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
 * Populates the database with a fulfilled referral for each guild member
 */
schema.statics.createDefaultReferrals = async function(
  this: CertainReferralModel,
  guild: Discord.Guild
) {
  if (guild.memberCount >= DISCORD_BIG_GUILD_MEMBER_SIZE) {
    await guild.fetchMembers();
  }

  const { id: guildDiscordId } = guild;

  const members = guild.members.array();
  const memberIds = members.map(({ id }) => id);
  const memberReferrals = await this.find({
    guildDiscordId,
    inviteeDiscordId: { $in: memberIds },
    fulfilled: true,
  });
  const referredMemberIds = memberReferrals.map(
    ({ inviteeDiscordId }) => inviteeDiscordId
  );
  const rest = compact(difference(memberIds, referredMemberIds));

  const referralsToInsert = rest.map(inviteeDiscordId => {
    return {
      guildDiscordId,
      inviteeDiscordId,
      active: true,
      fulfilled: true,
    };
  });

  await CertainReferral.insertMany(referralsToInsert);
};

/**
 * Calculates a GuildMember's score
 */
schema.statics.getMemberScore = async function(
  this: CertainReferralModel,
  { guild, id }: Discord.GuildMember,
  since?: Date
) {
  let getScoreSince = since;
  if (!getScoreSince) {
    const botInstance = await BotInstance.findOrCreate(
      guild,
      BOT_TYPES.REFERRAL_RANKS
    );
    getScoreSince = botInstance.config.countScoresSince || new Date(0);
  }

  const certainReferrals = await this.find({
    inviterDiscordId: id,
    guildDiscordId: guild.id,
    fulfilled: true,
    createdAt: { $gte: getScoreSince },
  });
  return reduce(certainReferrals, (total, { count }) => total + count, 0);
};

/**
 * Represents a certain use of an invite by a new guild member
 * for use with invites 3.0
 */
export const CertainReferral = mongoose.model<
  CertainReferralDocument,
  CertainReferralModel
>('Bot-ReferralRanks-CertainReferral', schema);
