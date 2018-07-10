import { Guild } from '@overmindbots/shared-models';
import {
  Invite,
  InviteUse,
  Rank,
} from '@overmindbots/shared-models/referralRanks';
import { InviteDocument } from '@overmindbots/shared-models/referralRanks/Invite';
import { Promise as P } from 'bluebird';
import Discord from 'discord.js';
import { chunk, each, map } from 'lodash';
import logger from 'winston';
import { DISCORD_ERROR_CODES } from '~/constants';

export interface InvitesPerUserItem {
  invitesUses: number;
  member: Discord.User;
}
export interface InvitesPerUser {
  [userId: string]: InvitesPerUserItem;
}

/**
 * Returns true if the guild passed is not yet provided by Discord's Gateway
 */
export function isGuildUnavailable(guild: Discord.Guild) {
  if (!guild.available) {
    logger.info(`> Guild "${guild.name}"not available`);
    return true;
  }
  return false;
}

/**
 * Looks at each user in a certain guild and if they have enough invites
 * assigns them their earned Role
 * @param userInvites a collection of
 */
export async function updateUsersRanks(
  invitesPerUserMap: InvitesPerUser,
  guild: Discord.Guild
) {
  // Convert object to array to handle sequentially with P.each
  const userInvitePairs = map(invitesPerUserMap, (invitesMap, inviterId) => ({
    inviterId,
    invitesMap,
  }));

  const hasRanks = await Rank.count({ guildDiscordId: guild.id }).exec();
  if (!hasRanks) {
    return;
  }

  await P.each(
    userInvitePairs,
    async ({ invitesMap: { invitesUses }, inviterId }) => {
      if (isGuildUnavailable(guild)) {
        return;
      }
      const rank = await Rank.getRankForInvites(invitesUses, guild);
      const member = guild.members.find('id', inviterId);
      if (!rank || !member) {
        logger.debug(`Either no rank or no member found for "${guild.name}".`);

        return;
      }
      const hasRole = member.roles.has(rank.roleDiscordId);
      if (!hasRole) {
        const role = guild.roles.find('id', rank.roleDiscordId);
        if (!role) {
          return;
        }
        await member.addRoles([role]);
        await member.send(
          `You have now reached the rank of \`${role.name}\` in **${
            guild.name
          }**, congratulations!`
        );
      }
    }
  );
}

/**
 * Builds an object representing total invite uses associated to a certain
 * user
 */
export function buildInvitesPerUser(
  invites: Discord.Collection<string, Discord.Invite>
) {
  const invitesPerUser: InvitesPerUser = {};

  invites.array().forEach(invite => {
    const { inviter, uses } = invite;
    if (!inviter) {
      return;
    }
    const { id } = inviter;
    if (!id) {
      return;
    }
    const userInvitesItem = invitesPerUser[id] || {
      invitesUses: 0,
      member: inviter,
    };
    userInvitesItem.invitesUses += uses;
    invitesPerUser[id] = userInvitesItem;
  });

  return invitesPerUser;
}

interface AssociationRecord {
  [guildId: string]: number;
}
const failedAssociations: AssociationRecord = {};
const successfulAssociations: AssociationRecord = {};

/**
 * Attempts to figure out what invite link a guild member used to join a Guild
 * This is not 100% reliable and should be replaced by a specialized service
 */
export async function attemptToAssociateInviteToUser({
  user,
  guild,
}: Discord.GuildMember) {
  const { username, id: userDiscordId } = user;
  const { id: guildDiscordId, memberCount } = guild;
  failedAssociations[guild.id] = failedAssociations[guild.id] || 0;
  successfulAssociations[guild.id] = successfulAssociations[guild.id] || 0;
  const updatedInvites = await guild.fetchInvites();
  const dbInvites = await Invite.find({ guildDiscordId }).exec();
  const inviteRecords: {
    [inviteCode: string]: InviteDocument;
  } = {};
  each(dbInvites, dbInvite => {
    inviteRecords[dbInvite.code] = dbInvite;
  });

  saveInvites(updatedInvites).catch(err => {
    logger.error('Error saving invites', err);
  });

  logger.debug(`Attempting to associate ${username} to an invite`);
  if (isGuildUnavailable(guild)) {
    return;
  }

  const guildRecord = await Guild.findOne({ discordId: guildDiscordId });

  // If there's no guild record yet then we can't detect this
  if (!guildRecord) {
    return;
  }

  const oldMembersCount = guildRecord.memberCount;
  const currentMembersCount = memberCount;
  const membersCountDelta = currentMembersCount - oldMembersCount;

  // We can add invites to users if only one user joined while checking this
  // right now
  if (membersCountDelta > 1) {
    failedAssociations[guild.id] += 1;
    return;
  }

  let associatedInvite: Discord.Invite | null = null;

  // Build an array of object showing previous vs new uses per invite
  const multipleInvitesUpdated = updatedInvites.some(invite => {
    const inviteRecord = inviteRecords[invite.code];

    // Invite has not been saved on the DB yet
    const previousUses = (inviteRecord && inviteRecord.uses) || 0;
    const currentUses = invite.uses;
    logger.debug(
      `Invite (${
        invite.code
      }): currentUses: ${currentUses}. previousUses: ${previousUses}`
    );
    const usesDelta = currentUses - previousUses;

    logger.debug(`Invite (${invite.code}) -> delta: ${usesDelta}`);

    if (usesDelta === 1) {
      if (associatedInvite) {
        return true;
      }

      associatedInvite = invite;
    }
    return false;
  });

  if (!associatedInvite) {
    failedAssociations[guild.id] += 1;
    return;
  }

  // If we find a delta but associatedInvite is already defined then
  // we have two invites that changed for one member
  // that joined, meaning we cannot associate and should abort.
  associatedInvite = associatedInvite as Discord.Invite;
  if (multipleInvitesUpdated) {
    failedAssociations[guild.id] += 1;
    return;
  }

  if (!associatedInvite.inviter) {
    failedAssociations[guild.id] += 1;
    return;
  }

  logger.debug(`Was able to associate "${username}" to an invite.`);

  const inviteUseData = {
    guildDiscordId,
    inviterDiscordId: associatedInvite.inviter.id,
    userDiscordId,
  };

  successfulAssociations[guild.id] += 1;

  await InviteUse.findOneAndUpdate(
    inviteUseData,
    {
      $set: inviteUseData,
      $inc: {
        uses: 1,
      },
    },
    { upsert: true }
  );

  logger.info(
    `Associations for for: ${guild.name} (${guild.memberCount}` +
      ` members)\n| Success: ${successfulAssociations[guild.id]}, ` +
      `Failure: ${failedAssociations[guild.id]} &&&`
  );
}

/**
 * Syncs list of invites to our database
 * TODO: This process is sequential and therefore very slow. Should be handled
 * externally
 */
export async function saveInvites(
  invites: Discord.Collection<string, Discord.Invite>
) {
  const inviteChunks = chunk(invites.array(), 50);
  await P.each(
    inviteChunks,
    async invitesChunk =>
      await P.map(invitesChunk, async invite => {
        const { code, inviter, guild, uses = 0 } = invite;

        const { id: inviterDiscordId } = inviter || { id: null };
        const { id: guildDiscordId } = guild || { id: null };

        if (!inviterDiscordId) {
          return;
        }

        await Invite.findOneAndUpdate(
          {
            code,
          },
          {
            code,
            guildDiscordId,
            inviterDiscordId,
            uses,
          },
          { upsert: true }
        );

        logger.debug('== Saved invite ==');
      })
  );
}

/**
 * Gets all invites in a guild and updates roles for each user as required
 * by it's Ranks
 */
export async function processGuildInvites(guild: Discord.Guild): Promise<any> {
  if (isGuildUnavailable(guild)) {
    return;
  }
  const ranks = await Rank.find({ guildDiscordId: guild.id }).exec();
  let invites: Discord.Collection<string, Discord.Invite>;

  try {
    invites = await guild.fetchInvites();
  } catch (err) {
    logger.debug(`Warning: Couldn't get invites for ${guild.name}.`);
    return;
  }

  if (ranks.length) {
    try {
      const invitesPerUserMap = buildInvitesPerUser(invites);
      await updateUsersRanks(invitesPerUserMap, guild);
    } catch (err) {
      if (err.code === DISCORD_ERROR_CODES.MISSING_PERMISSIONS) {
        logger.debug('Warning: Could not update rank of user');
        logger.debug(err);
      } else {
        logger.error(err);
      }
    }
  } else {
    logger.debug(
      `Skipping invites processing for "${guild.name}". No ranks yet`
    );
  }
}
