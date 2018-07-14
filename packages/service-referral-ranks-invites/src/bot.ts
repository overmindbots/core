import { Referral } from '@overmindbots/shared-models/referralRanks/Referral';
import { createAsyncCatcher } from '@overmindbots/shared-utils';
import P from 'bluebird';
import Discord from 'discord.js';
import _ from 'lodash';
import logger from 'winston';
import { BOT_TOKEN, TOTAL_SHARDS } from '~/constants';

/**
 * TODO:
 * - Assign shards correctly and prep for test run
 * - Decide what to do with database insert errors
 * - Decide what to do with mongoose create and model constructors not being
 *   strongly typed
 * - Force resuming of the session to receive lost events. Until then,
 *   all new invite uses cannot be assigned to an invitee
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
 * member queue and returns the guild lock
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
const noNewUsesThreshold = 100;

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
  shardId: 0,
});

client.login(BOT_TOKEN);

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
      `Tried to dequeue from uninitialized member queue. Guild id: "${guildId}"`
    );
  }

  if (queue.length < amount) {
    throw new Error(
      `Tried to dequeue more members than there are in the queue.\ 
      Guild id: "${guildId}"`
    );
  }

  return queue.splice(0, amount);
};

/**
 * - Fetches invites for a guild and populates the invite store
 * - Marks the guild as ready to listen to new member events
 */
const fetchInitialInvites = async (guild: Discord.Guild) => {
  const invites = (await guild.fetchInvites()).array();

  invites.forEach(invite => {
    inviteStore[invite.code] = {
      invite,
      newUses: 0,
    };
  });

  guildMetaDataStore[guild.id].ready = true;

  logger.info(`Guild "${guild.name} (${guild.id}) ready."`);
};

/**
 * Calculate total new uses across invites
 */
const calculateDelta = () => {
  return _.reduce(
    inviteStore,
    (sum: number, inviteData) => sum + inviteData.newUses,
    0
  );
};

/**
 * Get an array of the invites that have new uses
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
  const timestamp = new Date().getMilliseconds();

  logger.info(
    `Assigning referrals for guild "${guild.name}" (${guild.id})\
    with ${certainty * 100}% certainty`
  );
  _.forEach(usedInvites, usedInvite => {
    _.forEach(newMembers, newMember => {
      const newReferral = new Referral({
        guildDiscordId: guildId,
        inviterDiscordId: usedInvite.inviter.id,
        inviteeDiscordId: newMember.id,
        timestamp,
        certainty,
      });
      newReferral.save();
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

  const invites = (await guild.fetchInvites()).array();

  const usedInvites = calculateUsedInvites(invites);
  const delta = calculateDelta();
  const queue = newMemberQueues[guildId];

  const queueLength = queue ? queue.length : 0;

  /**
   * If there are more new uses than users in the queue we reset the guild lock
   * and wait for new users to join
   */
  if (delta > queueLength) {
    await setLock(guildId, delta).lock;
  }

  assignReferrals(usedInvites, guild, delta);

  /**
   * If there were no new uses, we update the count. If the count is lower than
   * the threshold, we continue the request loop
   */
  if (delta === 0) {
    noNewUsesCount += 1;
    guildMetaData.noNewUsesCount = noNewUsesCount;
  }

  if (noNewUsesCount < noNewUsesThreshold) {
    requestGuildInvites(guild);
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

    const guildId = guild.id;

    /**
     * Start with count greater than threshold to indicate that the request
     * loop is idle
     */
    guildMetaDataStore[guildId] = {
      ready: false,
      noNewUsesCount: noNewUsesThreshold + 1,
    };

    setLock(guildId);
  });

  logger.info(`UNAVAILABLE GUILDS: ${unavailableGuilds}`);

  // Fetch invites in chunks of 100 guilds at a time
  const chunkedGuilds = _.chunk(guilds.array(), 100);

  await P.each(chunkedGuilds, async (guildsChunk, chunkIndex) => {
    logger.info(
      `Reading guilds ${chunkIndex * 100} through ${(chunkIndex + 1) * 100}`
    );

    await P.map(guildsChunk, (guild, index) => {
      logger.info(
        `Reading guild ${index}: "${guild.name}" (${guild.memberCount} members)`
      );

      fetchInitialInvites(guild);
    });
  });
};

/**
 * Fetch invites for late guilds
 */
const guildCreateHandler = async (guild: Discord.Guild) => {
  logger.info(
    `Received late guild "${guild.name}" (${guild.memberCount} members)`
  );

  fetchInitialInvites(guild);
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

  logger.info(`New member added on guild "${guild.name}" (${guild.id}).`);

  pushToQueue(guildMember);

  const queue = newMemberQueues[guildId];

  const guildLock = guildLocks[guildId];

  // Signal the waiting request loop that it can assign users
  if (guildLock.expectedMemberCount <= queue.length) {
    guildLock.unlock();
  }

  // If the request loop is idle, start it
  if (guildMetaData.noNewUsesCount >= noNewUsesThreshold) {
    requestGuildInvites(guild);
  }
};

client.on('ready', eventAsyncCatcher('ready')(readyHandler));
client.on('guildCreate', eventAsyncCatcher('guildCreate')(guildCreateHandler));
client.on(
  'guildMemberAdd',
  eventAsyncCatcher('guildMemberAdd')(guildMemberAddHandler)
);
