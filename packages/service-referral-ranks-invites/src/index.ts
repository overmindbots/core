// tslint:disable-next-line ordered-imports
import '~/startup';

import { Referral } from '@overmindbots/shared-models/referralRanks/Referral';
import { createAsyncCatcher } from '@overmindbots/shared-utils/utils';
import P from 'bluebird';
import Discord, { DiscordAPIError } from 'discord.js';
import _ from 'lodash';
import logger from 'winston';

import {
  BOT_TOKEN,
  CHUNK_SIZE,
  MONGODB_URI,
  NO_NEW_USES_THRESHOLD,
  SHARD_ID,
  TOTAL_SHARDS,
} from '~/constants';

logger.info('=== Booting Service: Referral Ranks Invites ===');
logger.info(`=> MONGODB_URI: ${MONGODB_URI}`);
logger.info(`=> BOT_TOKEN: ${BOT_TOKEN}`);
logger.info(`=> SHARD_ID: ${SHARD_ID}`);
logger.info(`=> TOTAL_SHARDS: ${TOTAL_SHARDS}`);

/**
 * TODO:
 * - Decide what to do with database insert errors
 * - Decide what to do with mongoose create and model constructors not being
 *   strongly typed
 * - Force resuming of the session to receive lost events. Until then,
 *   all new invite uses cannot be assigned to an invitee
 *
 */

/**
 * In-memory storage of all invites
 */
const inviteStore: {
  [code: string]: {
    invite: Discord.Invite;
    newUses: number;
  };
} = {};

/**
 * New guild members are enqueued here
 */
const newMemberQueues: {
  [guildId: string]: Discord.GuildMember[];
} = {};

/**
 * Guild lock map. Whenever we fetch invites and the total delta is greater
 * than amount of enqueued new members, we must wait until the queue fills up
 * to continue. We use these locks to wait.
 */
const guildLocks: {
  [guildId: string]: {
    /**
     * Promise used to wait for the lock to release
     */
    lock: Promise<any>;

    /**
     * Amount of queued members required to release the lock
     */
    expectedMemberCount: number;

    /**
     * Method that releases the lock
     */
    unlock(): void;
  };
} = {};

/**
 * Set guild lock to a locked state waiting for a specific length of the
 * member queue and return the guild lock
 */
const setLock = (guildId: string, expectedMemberCount: number = 0) => {
  let guildLock = guildLocks[guildId];

  if (!guildLock) {
    guildLock = guildLocks[guildId] = {
      lock: new Promise(() => undefined),
      unlock: () => undefined,
      expectedMemberCount,
    };
  } else {
    guildLock.expectedMemberCount = expectedMemberCount;
  }

  guildLock.lock = new Promise(resolve => {
    guildLocks[guildId].unlock = resolve;
  });

  return guildLock;
};

interface GuildMetaData {
  /**
   * Marks if the guild's initial invite fetch is complete
   */
  ready: boolean;

  /**
   * Number of invite fetches that have been made without new uses
   */
  noNewUsesCount: number;
}

/**
 * Guild metadata map.
 */
const guildMetaDataStore: {
  [guildId: string]: GuildMetaData;
} = {};

/**
 * Amount of guild invite fetches with no new uses that have to be made
 * to be reasonably certain that no new members will arrive for a time
 */
const noNewUsesThreshold = NO_NEW_USES_THRESHOLD;

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
  fetchAllMembers: false,
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

/**
 * Sorts queue by joinedTimestamp using reverse bubblesort
 * this function assumes that the only potentially unordered element is the
 * last one
 */
const sortQueue = (queue: Discord.GuildMember[]) => {
  for (
    let current = queue.length - 1, previous = current - 1;
    current > 0;
    current -= 1, previous -= 1
  ) {
    if (queue[current].joinedTimestamp < queue[previous].joinedTimestamp) {
      [queue[current], queue[previous]] = [queue[previous], queue[current]];
    } else {
      break;
    }
  }

  return queue;
};

/**
 * Push guild member to corresponding guild queue, ordered by joinedTimestamp
 */
const pushToQueue = (guildMember: Discord.GuildMember) => {
  const guildId = guildMember.guild.id;
  const queue = newMemberQueues[guildId] || [];

  queue.push(guildMember);

  newMemberQueues[guildId] = sortQueue(queue);
};

/**
 * Get first n members from the queue
 */
const dequeue = (guildId: string, amount: number = 1) => {
  const queue = newMemberQueues[guildId];

  if (!queue) {
    throw new Error(
      `[${guildId}] Tried to dequeue from uninitialized member queue`
    );
  }

  if (queue.length < amount) {
    throw new Error(
      `[${guildId}] Tried to dequeue more members than there are in the queue`
    );
  }

  return queue.splice(0, amount);
};

/**
 * Initialize a guild's metadata and lock
 */
const initializeGuild = (guildId: string) => {
  /**
   * Start with count greater than threshold to indicate that the request
   * loop is idle
   */
  guildMetaDataStore[guildId] = {
    ready: false,
    noNewUsesCount: noNewUsesThreshold + 1,
  };

  setLock(guildId);
};

/**
 * - Fetches invites for a guild and populates the invite store
 * - Marks the guild as ready to listen to new member events
 */
const fetchInitialInvites = async (guild: Discord.Guild) => {
  let invites;
  let guildId = guild.id;

  try {
    invites = (await guild.fetchInvites()).array();
  } catch (e) {
    if (e.code !== 50013) {
      logger.error(
        `[${guildId}] Error ${e.message} on invite request, retrying...`
      );
      await fetchInitialInvites(guild);
      return;
    } else {
      logger.debug(
        `[${guildId}] Permissions missing (initial invites read)`
      );
    }
  }

  if (invites) {
    invites.forEach(invite => {
      inviteStore[invite.code] = {
        invite,
        newUses: 0,
      };
    });
  }

  guildMetaDataStore[guildId].ready = true;

  logger.info(`[${guildId}] "${guild.name}" ready`);
};

/**
 * Calculate total new uses across invites for a guild
 */
const calculateDelta = (guildId: string) => {
  const guildInvites = _.filter(
    inviteStore,
    inviteData => inviteData.invite.guild.id === guildId
  );

  return _.reduce(
    guildInvites,
    (sum: number, inviteData) => sum + inviteData.newUses,
    0
  );
};

/**
 * Get an array of the invites that have new uses in the guild
 */
const calculateUsedInvites = (invites: Discord.Invite[]) => {
  const usedInvites: Discord.Invite[] = [];

  _.forEach(invites, invite => {
    const code = invite.code;
    const storedInvite = inviteStore[code];

    let previousUses: number;

    // If the invite is new, we know that every use is new
    if (!storedInvite) {
      previousUses = 0;
    } else {
      previousUses = storedInvite.invite.uses;
    }

    const newUses = invite.uses - previousUses;

    // Store the new invite information in memory and update the new uses count
    inviteStore[code] = {
      invite,
      newUses,
    };

    // If the invite has uses, we push it to the array
    if (newUses > 0) {
      usedInvites.push(invite);
    }
  });

  return usedInvites;
};

/**
 * Insert a referral record for each combination of inviter and invitee,
 * calculating a certainty value which is 1/delta
 */
const assignReferrals = (
  usedInvites: Discord.Invite[],
  guild: Discord.Guild,
  delta: number
) => {
  const guildId = guild.id;
  const newMembers = dequeue(guildId, delta);
  const certainty = 1 / delta;
  const timestamp = Date.now();

  _.forEach(usedInvites, usedInvite => {
    if (!usedInvite.inviter) {
      logger.debug(`[${guildId}] Invite '${usedInvite.code}' has no inviter. \
Skipping...`);
      return;
    }

    /**
     * There's more certainty if the invite has more uses
     */
    const inviteCertainty = certainty * inviteStore[usedInvite.code].newUses;

    logger.info(
      `[${guildId}] Assigning ${newMembers.length} members to invite \
"${usedInvite.code}" with ${inviteCertainty * 100}% certainty`
    );

    _.forEach(newMembers, newMember => {
      const newReferral = new Referral({
        guildDiscordId: guildId,
        inviterDiscordId: usedInvite.inviter.id,
        inviteeDiscordId: newMember.id,
        timestamp,
        certainty: inviteCertainty,
      });
      newReferral.save().catch(err => {
        logger.error(err);
      });
    });
  });
};

/**
 * - Fetch invites for the guild
 * - Determine invites with new uses
 * - Calculate total amount of new uses
 * - Wait until there are as much enqueued members as new invite uses
 * - Assign referrals
 * - Continue requesting invites if there have been new invite uses in the last
 *   <noNewUsesThreshold> requests
 */
const requestGuildInvites = async (guild: Discord.Guild) => {
  const guildId = guild.id;
  const guildMetaData = guildMetaDataStore[guildId];
  let { noNewUsesCount } = guildMetaData;

  let invites;

  logger.debug(`[${guildId}] Fetching invites`);

  try {
    invites = (await guild.fetchInvites()).array();
  } catch (e) {
    if (e.code !== 50013) {
      logger.error(
        `[${guildId}] Error ${e.message} on invite request, retrying...`
      );
      await requestGuildInvites(guild);

      return;
    } else {
      // Permissions required, we set the loop to idle and clear the user queue
      guildMetaData.noNewUsesCount = noNewUsesThreshold + 1;
      newMemberQueues[guildId] = [];
      logger.debug(
        `[${guildId}] Permissions missing for guild (request invites)`
      );

      return;
    }
  }

  const usedInvites = calculateUsedInvites(invites);
  const delta = calculateDelta(guildId);
  const queue = newMemberQueues[guildId];

  const queueLength = queue ? queue.length : 0;

  logger.debug(
    `[${guildId}] Invites fetched. DELTA = ${delta} accross \
${usedInvites.length} invites, QUEUE_LENGTH = ${queueLength}`
  );

  /**
   * If there are more new uses than users in the queue we reset the guild lock
   * and wait for new users to join
   */
  if (delta > queueLength) {
    logger.debug(
      `[${guildId}] Waiting for lock`
    );
    await setLock(guildId, delta).lock;
    logger.debug(`[${guildId}] Lock released`);
  }

  /**
   * If there were no new uses, we update the count. If there are, we reset it.
   * If the count is lower than the threshold, we continue the request loop
   */
  if (delta === 0) {
    const usedInvitesLength = usedInvites.length;
    if (usedInvitesLength > 0) {
      // This should never happen
      logger.error(`[${guildId}] Calculation error, \
${usedInvitesLength} used invites, delta = 0`);
    }

    noNewUsesCount += 1;
    guildMetaData.noNewUsesCount = noNewUsesCount;
  } else if (delta > 0) {
    // reset the count
    guildMetaData.noNewUsesCount = 0;
    assignReferrals(usedInvites, guild, delta);
  } else {
    // Delta < 0, this should never happen
    logger.error(`Calculation error for guild ${guildId}, delta < 0`);
  }

  if (noNewUsesCount < noNewUsesThreshold) {
    await requestGuildInvites(guild);
  } else {
    logger.debug(`[${guildId}] Stopping loop`);
  }
};

/**
 * Startup:
 *
 * - Initialize in-memory stores, locks and guild metadata
 * - Fetch invites for every guild
 */
const readyHandler = async () => {
  const guilds = client.guilds;
  let unavailableGuilds = 0;
  logger.info('Invite manager ready.');
  logger.info(`Fetching invites for ${guilds.size} guilds...`);

  // Initialize guild locks, guild metadata and count unavailable guilds
  guilds.forEach(guild => {
    if (!guild.available) {
      unavailableGuilds += 1;
    }

    initializeGuild(guild.id);
  });

  logger.info(`UNAVAILABLE GUILDS: ${unavailableGuilds}`);

  // Fetch invites in chunks of <CHUNK_SIZE> guilds at a time
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

      await fetchInitialInvites(guild);
    });
  });
};

/**
 * Fetch invites for late guilds
 */
const guildCreateHandler = async (guild: Discord.Guild) => {
  logger.info(
    `[${guild.id}] Received "${guild.name}" (${guild.memberCount} members)`
  );

  initializeGuild(guild.id);

  await fetchInitialInvites(guild);
};

/**
 * - Push new member to queue
 * - Unlock guild lock if there are sufficient new members in the queue
 * - Request guild invites if there isn't an ongoing request loop
 */
const guildMemberAddHandler = async (guildMember: Discord.GuildMember) => {
  const guild = guildMember.guild;
  const guildId = guild.id;

  const guildMetaData = guildMetaDataStore[guildId];

  // If initial fetch hasn't been done, ignore
  if (!guildMetaData.ready) {
    return;
  }

  pushToQueue(guildMember);

  const queue = newMemberQueues[guildId];

  logger.info(
    `[${guildId}] New member added on "${guild.name}". \
QUEUE_LENGTH = ${queue.length}`
  );

  const guildLock = guildLocks[guildId];

  // Signal the waiting request loop that it can assign users
  if (guildLock.expectedMemberCount <= queue.length) {
    guildLock.unlock();
  }

  // If the request loop is idle, start it and reset the count
  if (guildMetaData.noNewUsesCount >= noNewUsesThreshold) {
    guildMetaData.noNewUsesCount = 0;
    await requestGuildInvites(guild);
  }
};

const discordErrorHandler = async (error: DiscordAPIError) => {
  logger.error(error.message);
  // tslint:disable-next-line no-console
  console.log(error);
};

client.on('ready', eventAsyncCatcher('ready')(readyHandler));
client.on('guildCreate', eventAsyncCatcher('guildCreate')(guildCreateHandler));
client.on(
  'guildMemberAdd',
  eventAsyncCatcher('guildMemberAdd')(guildMemberAddHandler)
);
client.on('error', eventAsyncCatcher('error')(discordErrorHandler));
