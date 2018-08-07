// tslint:disable-next-line ordered-imports
import { CertainReferral } from '@overmindbots/shared-models/referralRanks';
import {
  createAsyncCatcher,
  omitEvents,
} from '@overmindbots/shared-utils/utils';
import P from 'bluebird';
import Discord, { DiscordAPIError } from 'discord.js';
import _ from 'lodash';
import mongoose from 'mongoose';
import logger from 'winston';
import {
  BOT_TOKEN,
  BOT_TYPE,
  CHUNK_SIZE,
  MONGODB_URI,
  SHARD_ID,
  TOTAL_SHARDS,
} from '~/constants';
import '~/startup';

import { BotInstance } from '../node_modules/@overmindbots/shared-models/src/BotInstance';
import { DISCORD_BIG_GUILD_MEMBER_SIZE } from '../node_modules/@overmindbots/shared-utils/src/constants';

logger.info('=== Booting Service: Referral Ranks Fulfillment ===');
logger.info(`=> MONGODB_URI: ${MONGODB_URI}`);
logger.info(`=> BOT_TOKEN: ${BOT_TOKEN}`);
logger.info(`=> SHARD_ID: ${SHARD_ID}`);
logger.info(`=> TOTAL_SHARDS: ${TOTAL_SHARDS}`);

const client = new Discord.Client({
  disabledEvents: omitEvents([
    'READY',
    'RESUMED',
    'GUILD_SYNC',
    'GUILD_CREATE',
    'GUILD_DELETE',
    'GUILD_UPDATE',
    'GUILD_MEMBER_ADD',
    'GUILD_MEMBER_REMOVE',
    'CHANNEL_CREATE',
    'CHANNEL_DELETE',
    'CHANNEL_UPDATE',
  ]),
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

interface AggregatedReferral {
  _id: string;
  referralId: mongoose.Types.ObjectId;
}

/**
 * Fetch current guild members and update referrals based on them
 */
const checkGuildMembers = async (guild: Discord.Guild) => {
  if (guild.memberCount >= DISCORD_BIG_GUILD_MEMBER_SIZE) {
    await guild.fetchMembers();
  }
  const memberIds = guild.members.map(({ id }) => id);
  const guildId = guild.id;

  /**
   * Group referrals by guild/invitee pair and
   * get only the oldest one for each group
   */
  const firstReferrals = (await CertainReferral.aggregate([
    {
      $match: {
        guildDiscordId: guildId,
        inviteeDiscordId: { $in: memberIds },
      },
    },
    { $sort: { createdAt: 1 } },
    { $group: { _id: '$inviteeDiscordId', referralId: { $first: '$_id' } } },
  ])) as AggregatedReferral[];

  const referralIdsToMarkAsFulfilled = firstReferrals.map(
    ({ referralId }) => referralId
  );

  /**
   * - Mark referrals for new members as fulfilled
   * - Mark referrals for removed members as inactive
   */
  try {
    logger.info(`[${guildId}] Updating fulfillment and inactivity`);
    await P.all([
      CertainReferral.updateMany(
        { _id: { $in: referralIdsToMarkAsFulfilled } },
        { fulfilled: true, active: true }
      ),
      CertainReferral.updateMany(
        { inviteeId: { $nin: memberIds } },
        { active: false }
      ),
    ]);
  } catch (err) {
    logger.error(err.message, err);
  }
};

const isUsingNextVersion = async (guild: Discord.Guild) => {
  const botInstance = await BotInstance.findOrCreate(guild, BOT_TYPE);
  return botInstance.config.isNextVersion || false;
};

/**
 * Check members and update fulfilled or inactive referrals for each guild
 * Ignore guilds using the older version
 */
const readyHandler = async () => {
  logger.info('Client ready.');
  const guilds = client.guilds;

  // Check members in chunks of <CHUNK_SIZE> guilds at a time
  const chunkedGuilds = _.chunk(guilds.array(), CHUNK_SIZE);

  await P.each(chunkedGuilds, async (guildsChunk, chunkIndex) => {
    const baseIndex = chunkIndex * CHUNK_SIZE + 1;
    logger.info(
      `Reading guilds ${baseIndex} through ${baseIndex + CHUNK_SIZE - 1}`
    );

    await P.map(guildsChunk, async (guild, index) => {
      logger.info(
        `[${guild.id}] Reading ${baseIndex + index}: "${guild.name}" \
(${guild.memberCount} members)`
      );

      if (!(await isUsingNextVersion(guild))) {
        logger.info(`[${guild.id}] Using legacy version, skipping...`);
        return;
      }

      await checkGuildMembers(guild);
    });
  });
};

/**
 * Check members for late guilds
 */
const guildCreateHandler = async (guild: Discord.Guild) => {
  logger.info(
    `[${guild.id}] Received "${guild.name}" (${guild.memberCount} members)`
  );

  if (!(await isUsingNextVersion(guild))) {
    logger.info(`[${guild.id}] Using legacy version, skipping...`);
    return;
  }

  await checkGuildMembers(guild);
};

/**
 * Fulfill the member's oldest referral if it hasn't been fulfilled already
 */
const guildMemberAddHandler = async (guildMember: Discord.GuildMember) => {
  const {
    guild: { id: guildDiscordId },
    guild,
    id: inviteeDiscordId,
  } = guildMember;

  if (!(await isUsingNextVersion(guild))) {
    return;
  }

  logger.info(`[${guildDiscordId}] New member, fulfilling referral`);
  await CertainReferral.findOneAndUpdate(
    {
      guildDiscordId,
      inviteeDiscordId,
    },
    { fulfilled: true, active: true },
    { sort: { createdAt: 1 } }
  );
};

/**
 * Set the member's oldest referral as inactive if it exists
 */
const guildMemberRemoveHandler = async (guildMember: Discord.GuildMember) => {
  const {
    guild: { id: guildDiscordId },
    guild,
    id: inviteeDiscordId,
  } = guildMember;

  if (!(await isUsingNextVersion(guild))) {
    return;
  }

  logger.info(`[${guildDiscordId}] Member left, marking referral as inactive`);
  await CertainReferral.findOneAndUpdate(
    { guildDiscordId, inviteeDiscordId },
    { active: false },
    { sort: { createdAt: 1 } }
  );
};

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
