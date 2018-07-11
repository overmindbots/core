import { Guild } from 'discord.js';
import mongoose from 'mongoose';

export interface RankDocument extends mongoose.Document {
  roleDiscordId: string;
  guildDiscordId: string;
  invitesRequired: number;
}
export interface RankModel extends mongoose.Model<RankDocument> {
  getNextRank(invites: number, guild: Guild): RankDocument;
  getRankForInvites(invites: number, guild: Guild): RankDocument;
}

const schema = new mongoose.Schema({
  guildDiscordId: {
    required: true,
    type: String,
  },
  invitesRequired: {
    required: true,
    type: Number,
  },
  roleDiscordId: {
    required: true,
    type: String,
  },
});

schema.statics.getRankForInvites = async function(
  invites: number,
  guild: Guild
) {
  const result = await this.find({
    guildDiscordId: guild.id,
    invitesRequired: {
      $lte: invites,
    },
  })
    .sort({ invitesRequired: -1 })
    .limit(1);
  return result[0];
};

schema.statics.getNextRank = async function getNextRank(
  invites: number,
  guild: Guild
) {
  const [result] = await this.find({
    guildDiscordId: guild.id,
    invitesRequired: {
      $gt: invites,
    },
  })
    .sort({ invitesRequired: 1 })
    .limit(1);

  return result;
};

schema.index({ guildDiscordId: 1, invitesRequired: -1 });
schema.index({ roleDiscordId: 1, guildDiscordId: 1 }, { unique: true });

/**
 * Represents a requirement of invites assigned to a Role
 */
export const Rank = mongoose.model<RankDocument, RankModel>(
  'Bot-ReferralRanks-Rank',
  schema
);
