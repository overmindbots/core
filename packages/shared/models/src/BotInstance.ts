import { Guild } from 'discord.js';
import mongoose from 'mongoose';

import {
  BOT_TYPES,
  ReferralRanksBotConfig,
} from '@overmindbots/shared-utils/src/constants';

export interface BotInstanceDocument extends mongoose.Document {
  botType: BOT_TYPES;
  config: ReferralRanksBotConfig;
  enabled: boolean;
  guildDiscordId: string;
  maxRoleDiscordId: string;
}

export interface BotInstanceModel extends mongoose.Model<BotInstanceDocument> {
  findOrCreate(
    guild: Guild,
    botType: BOT_TYPES,
    disable?: boolean
  ): Promise<BotInstanceDocument>;
}

const schema = new mongoose.Schema({
  guildDiscordId: {
    type: String,
    required: true,
  },
  discordId: {
    type: String, // Old value
  },
  botType: {
    type: String,
    required: true,
    default: BOT_TYPES.REFERRAL_RANKS,
  },
  enabled: {
    type: Boolean,
    default: true,
  },
  config: {
    type: mongoose.SchemaTypes.Mixed,
    required: true,
    default: {
      prefix: '!',
    },
  },
  maxRoleDiscordId: {
    type: String,
  },
});

schema.statics.findOrCreate = async function(
  this: BotInstanceModel,
  guild: Guild,
  botType: BOT_TYPES,
  disable: boolean
) {
  const { id: guildDiscordId } = guild;

  await this.findOneAndUpdate(
    { guildDiscordId, botType },
    {
      $set: {
        botType,
        enabled: !disable,
        guildDiscordId,
      },
    },
    { upsert: true }
  );

  const botInstance = await this.findOne({ guildDiscordId, botType });

  return botInstance;
};

schema.index({ guildDiscordId: 1, botType: 1 }, { unique: true });

/**
 * The presence of a bot in a guild. Here we store settings for a bot type
 * in a certain Guild along with other related data
 */
export const BotInstance = mongoose.model<
  BotInstanceDocument,
  BotInstanceModel
>('BotInstance', schema);
