// tslint:disable-next-line ordered-imports
import '~/startup';

import { CertainReferral } from '@overmindbots/shared-models/referralRanks';
import { createAsyncCatcher } from '@overmindbots/shared-utils/utils';
import Discord, { DiscordAPIError } from 'discord.js';
import _ from 'lodash';
import logger from 'winston';

import {
  BOT_TOKEN,
  GUILD_CHECK_INTERVAL,
  MONGODB_URI,
  SHARD_ID,
  TOTAL_SHARDS,
} from '~/constants';

logger.info('=== Booting Service: Referral Ranks Fulfillment ===');
logger.info(`=> MONGODB_URI: ${MONGODB_URI}`);
logger.info(`=> BOT_TOKEN: ${BOT_TOKEN}`);
logger.info(`=> SHARD_ID: ${SHARD_ID}`);
logger.info(`=> TOTAL_SHARDS: ${TOTAL_SHARDS}`);

/**
 * TODO:
 * - Answer questions in issue #133
 * - Implement event handlers
 * - Improve comments
 * - Add logging
 * - Run utility to catch dangling promises
 */

// NOTE: For now use 1 shard for development
const client = new Discord.Client({
  disabledEvents: [
    'TYPING_START',
    'MESSAGE_UPDATE',
    'MESSAGE_REACTION_ADD',
    'MESSAGE_REACTION_REMOVE',
    'VOICE_SERVER_UPDATE',
    'VOICE_STATE_UPDATE',
  ],
  fetchAllMembers: true,
  messageCacheMaxSize: 1,
  shardCount: TOTAL_SHARDS,
  shardId: SHARD_ID,
});

client.login(BOT_TOKEN).catch(err => {
  logger.error(err);
});

const genericAsyncCatcher = createAsyncCatcher(async error => {
  logger.error(error.message, error);
});

/**
 * Intended for future usage in managing errors that commands did not catch
 */
const manageError = genericAsyncCatcher(async () => {
  return false;
});

/**
 * Catches async errors associated to events
 */
const eventAsyncCatcher = (eventName: string) =>
  createAsyncCatcher(async error => {
    const managed = await manageError(error);

    if (managed) {
      logger.debug(`Error managed: ${error.message}`);
      return;
    }

    logger.error(`Event error (${eventName})`);
    // tslint:disable-next-line
    console.error(error);
  });

const discordErrorHandler = async (error: DiscordAPIError) => {
  logger.error(error.message, error);
};

/**
 * Update referrals based on current guild members
 */
const checkGuildMembers = (guild: Discord.Guild) => {
  const memberIds = guild.members.map(member => member.id);

  memberIds.forEach(async memberId => {
    const referral = await CertainReferral.findOne(
      { guildDiscordId: guild.id, inviteeId: memberId },
      { sort: { timestamp: 1 } }
    );

    if (!referral || referral.fulfilled) {
      return;
    }

    referral.update({ fulfilled: true });
  });
};

/**
 * Start interval for each guild
 */
const readyHandler = async () => {
  const guilds = client.guilds;

  guilds.forEach(guild => {
    client.setInterval(checkGuildMembers, GUILD_CHECK_INTERVAL, guild);
  });
};

const guildCreateHandler = async () => {};

const guildMemberAddHandler = async () => {};

const guildMemberRemoveHandler = async () => {};

client.on('ready', eventAsyncCatcher('ready')(readyHandler));
client.on('guildCreate', eventAsyncCatcher('guildCreate')(guildCreateHandler));
client.on(
  'guildMemberAdd',
  eventAsyncCatcher('guildMemberAdd')(guildMemberAddHandler)
);
client.on(
  'guildMemberRemove',
  eventAsyncCatcher('guildMemberRemove')(guildMemberRemoveHandler)
);
client.on('error', eventAsyncCatcher('error')(discordErrorHandler));
