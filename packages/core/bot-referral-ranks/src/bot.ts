import { ProcessMessageResultCodes } from '@overmindbots/discord.js-command-manager';
import { BotInstance, Guild, Role } from '@overmindbots/shared-models';
import { Rank } from '@overmindbots/shared-models/referralRanks';
import { createAsyncCatcher } '@overmindbots/shared-utils';
import { Promise as P } from 'bluebird';
import Discord from 'discord.js';
import { chunk, difference, map, maxBy } from 'lodash';
import mongoose from 'mongoose';
import { connection } from 'websocket';
import logger from 'winston';
import { cache } from '~/cache';
import { commandManager } from '~/commandManager';
import {
  attemptToAssociateInviteToUser,
  isGuildUnavailable,
  processGuildInvites,
} from '~/commands/utils';
import {
  BOT_ALCHEMY_DISCORD_ID,
  BOT_ALCHEMY_LOG_CHANNEL_NAME,
  BOT_GREETING_MESSAGE,
  BOT_TOKEN,
  BOT_TYPE,
  POD_ID,
  VERSION,
} from '~/constants';
import { podStatusServer } from '~/podStatusServer';
import {
  ClientMsgTypes,
  ReportGuildCreateClientMsg,
  ReportGuildDeleteClientMsg,
  ShardShuttingDownClientMsg,
} from '~/shared/serviceMessageTypes';
import { debounceBy, enqueueBy } from '~/utils';

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
 * DiscordClient typeguard
 */
function isDiscordClient(client?: Discord.Client): client is Discord.Client {
  if (!client) {
    throw new Error(
      'Attempted to interact with the bot without initializing it first'
    );
  }

  return !!client;
}

/**
 * Singleton that manages the bot shard running
 */
export class Bot {
  public client?: Discord.Client;
  public shardId?: number;
  public starting: Promise<any>;
  public markStarted?: () => void;
  public botManagerConnection: null | connection;
  public teamDiscord: Discord.Guild | null;

  constructor() {
    this.botManagerConnection = null;
    this.teamDiscord = null;
    this.starting = new Promise(resolve => {
      this.markStarted = resolve;
    });
  }

  /**
   * Starts the bot
   */
  public start = async () => {
    logger.info('>> Starting bot');
    if (!isDiscordClient(this.client)) {
      return;
    }
    await this.client.login(BOT_TOKEN);
    logger.info('>> Logged in');
    await this.updateAllBotInstances();
    await this.starting;
  };

  /**
   * Initialized the client with required config
   */
  public initializeBotClient = (
    shardId: number,
    botManagerConnection: connection,
    totalShards: number
  ) => {
    this.shardId = shardId;
    this.botManagerConnection = botManagerConnection;
    this.client = new Discord.Client({
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
      shardCount: totalShards,
      shardId,
    });

    this.setupEventListeners();

    logger.info(`>> Initialized Bot Client - ShardId: ${shardId}`);
  };

  /**
   * Reports to the manager when the bot is added to a new guild
   */
  public reportGuildCreateToManager = async (guild: Discord.Guild) => {
    if (!this.botManagerConnection) {
      return;
    }
    const message: ReportGuildCreateClientMsg = {
      type: ClientMsgTypes.REPORT_GUILD_CREATE,
      payload: {
        name: guild.name,
        memberCount: guild.memberCount,
      },
    };
    this.botManagerConnection.send(JSON.stringify(message));
  };
  /**
   * Reports to the manager when the bot is added to a new guild
   */
  public reportGuildDeleteToManager = async (guild: Discord.Guild) => {
    if (!this.botManagerConnection) {
      return;
    }
    const message: ReportGuildDeleteClientMsg = {
      type: ClientMsgTypes.REPORT_GUILD_DELETE,
      payload: {
        name: guild.name,
        memberCount: guild.memberCount,
      },
    };
    this.botManagerConnection.send(JSON.stringify(message));
  };
  /**
   * Calls processGuildInvites safely by debouncing it
   */
  public processGuildInvites = async (guild: Discord.Guild) => {
    await debounceBy(
      `processGuildInvites/${guild.id}`,
      processGuildInvites,
      60 * 1000,
      { maxWait: 60 * 1000 }
    )(guild);
  };

  /**
   * Syncs latest state of a guilds roles to our database
   */
  public initializeRolesData = async (guild: Discord.Guild) => {
    await enqueueBy(`${guild.id}/initializeRolesData`, async () => {
      await this.deleteOldRoles(guild);
      await this.syncRoles(guild, false);
    });
  };

  /**
   * Removes roles from our database that don't exist in a guild anymore
   * NOTE: We get a roleDelete event when our own bot is removed from a guild,
   * for this reason we have to check for guild availability
   */
  public deleteOldRoles = async (guild: Discord.Guild) => {
    if (!guild.available) {
      return;
    }
    const currentRolesIds = guild.roles.map(({ id: discordId }) => discordId);
    const roles = await Role.find({ guildDiscordId: guild.id });
    const dbRoleIds = map(roles, ({ discordId }) => discordId);
    const deletableRoleIds = difference(dbRoleIds, currentRolesIds);

    await Role.deleteMany({ discordId: { $in: deletableRoleIds } });
  };

  /**
   * Adds or edits roles in our database according to latest state of roles
   * in a guild
   */
  public upsertRoles = async (guild: Discord.Guild) => {
    if (guild.available) {
      return;
    }
    const botClient = this.client as Discord.Client;

    await P.each(guild.roles.array(), async role => {
      const {
        id: discordId,
        name,
        color,
        position,
        permissions,
        managed,
        mentionable,
      } = role;
      const data = {
        discordId,
        name,
        color,
        position,
        permissions,
        managed,
        mentionable,
        guildDiscordId: guild.id,
      };

      const result = await Role.findOneAndUpdate(
        {
          discordId,
        },
        data,
        {
          upsert: true,
        }
      );

      if (!result) {
        logger.debug(`> Saved new role ${name} for guild ${guild.name}`);
      }
    });

    if (!botClient.user) {
      throw new Error(`Bot client user for ${guild.name} doesn't exist`);
    }
    const ownMember = guild.members.find('id', botClient.user.id);
    const maxRole = maxBy(ownMember.roles.array(), 'position');
    if (!maxRole) {
      throw new Error(`No role was found on bot for guild: ${guild.name}`);
    }
    const botInstance = await BotInstance.findOrCreate(guild, BOT_TYPE);
    botInstance.maxRoleDiscordId = maxRole.id;

    await botInstance.save();
  };

  /**
   * Updates roles to latest state in guild
   * @param enqueue wether or not to do the defer the task in the queue
   */
  public syncRoles = async (guild: Discord.Guild, enqueue = true) => {
    if (isGuildUnavailable(guild)) {
      return;
    }

    if (enqueue) {
      await enqueueBy(`${guild.id}/upsertRoles`, async () => {
        await this.deleteOldRoles(guild);
        await this.upsertRoles(guild);
      });
    } else {
      await this.upsertRoles(guild);
      await this.deleteOldRoles(guild);
    }
  };

  /**
   * Upserts a guild to the database
   */
  public saveGuild = async (guild: Discord.Guild) => {
    if (isGuildUnavailable(guild)) {
      return;
    }
    const { id: discordId, name, memberCount, ownerID: userDiscordId } = guild;
    const data = {
      $set: {
        discordId,
        memberCount,
        name,
        userDiscordId,
      },
    };
    const result = await Guild.findOneAndUpdate(
      {
        discordId,
      },
      data,
      {
        upsert: true,
      }
    );

    if (!result) {
      logger.info(`> Saved new guild ${name}`);
    }
  };

  /**
   * Sends a string that will be logged in our discord group
   */
  public logToBotAlchemyDiscord = async (message: string) => {
    if (!this.teamDiscord) {
      throw new Error(
        'Incorrectly called log on shard that does not have discord'
      );
    }
    const logChannel = this.teamDiscord.channels.find(
      'name',
      BOT_ALCHEMY_LOG_CHANNEL_NAME
    );

    if (logChannel) {
      await (logChannel as Discord.TextChannel).send(message);
    }
  };
  /**
   * Updates all BotInstance records associated to guilds available
   * for this client. Also prints to console list of guilds
   * with most users
   */
  public updateAllBotInstances = async () => {
    const chunkSize = 10;
    const guildsArray = (this.client as Discord.Client).guilds
      .sort((a, b) => b.memberCount - a.memberCount)
      .array();
    logger.info(`=== Top guilds for Shard ${this.shardId} ===\n${guildsArray
      .map(({ name, memberCount }) => `- ${name}: ${memberCount}`)
      .slice(0, 20)
      .join('\n')}
    `);
    const guildChunks = chunk(guildsArray, chunkSize);

    await P.each(guildChunks, async (guildChunk, index) => {
      const startTime = Date.now();
      const chunkPromises = map(guildChunk, async guild => {
        await P.all([
          this.saveGuild(guild),
          this.saveBotInstance(guild),
          this.initializeRolesData(guild),
        ]);
      });
      await P.all(chunkPromises);
      const elapsedTime = (Date.now() - startTime) / 1000;
      logger.info(
        `## Saved guild chunk ${index + 1}/${
          guildChunks.length
        } | Time elapsed: ${elapsedTime} seconds`
      );
    });
  };
  /**
   * Deletes a Rank associated to a given role
   */
  public deleteRankForRole = async ({
    id: roleDiscordId,
    guild: { id: guildDiscordId },
  }: Discord.Role) => {
    const rank = await Rank.findOne({ roleDiscordId, guildDiscordId });
    if (!rank) {
      return;
    }

    logger.debug(
      `Deleting rank for deleted roleId: ${roleDiscordId}, RankId: ${rank.id}`
    );
    await rank.remove();
  };
  /**
   * Saves a bot instances associated to aguild
   * @param disable Mark the botInstance as disabled
   */
  public saveBotInstance = async (guild: Discord.Guild, disable = false) => {
    if (isGuildUnavailable(guild)) {
      return;
    }
    const { id: guildDiscordId } = guild;
    const data = {
      botType: BOT_TYPE,
      enabled: !disable,
      guildDiscordId,
      $unset: {
        discordId: 1,
      },
    };

    const result = await BotInstance.findOneAndUpdate(
      {
        botType: BOT_TYPE,
        $or: [{ discordId: guildDiscordId }, { guildDiscordId }],
      },
      data,
      {
        setDefaultsOnInsert: true,
        upsert: true,
      }
    );

    return result;
  };
  /**
   * Sends the greeting message to the owner of a guild
   */
  public sendGreetingMessageToGuildOwner = async (guild: Discord.Guild) => {
    if (isGuildUnavailable(guild)) {
      return;
    }

    await guild.owner.send(BOT_GREETING_MESSAGE);
  };

  /**
   * Updates bot's presence status
   */
  public updatePresenceStatus = async (status: string) => {
    if (!isDiscordClient(this.client)) {
      return;
    }

    await this.starting;

    if (!this.client.user) {
      logger.warn(
        "Client disconnected, shard might've been reassigned" +
          ' or connection with botManager might be paused'
      );
      return;
    }

    void this.client.user.setPresence({
      game: { name: status },
      status: 'online',
    });
  };
  /**
   * Closes connection with bot manager if it is open
   */
  public closeBotManagerConnection = async () => {
    await new Promise(resolve => {
      if (this.botManagerConnection && this.botManagerConnection.connected) {
        const closeMessage: ShardShuttingDownClientMsg = {
          type: ClientMsgTypes.SHARD_SHUTTING_DOWN,
          payload: {
            shardId: this.shardId,
            podId: POD_ID,
          },
        };
        this.botManagerConnection.send(JSON.stringify(closeMessage));
        this.botManagerConnection.on('close', () => {
          // Wait for bot-manager to close connection
          logger.info('=> Bot manager connection closed');
          resolve();
        });
      } else {
        logger.info('=> Bot manager already closed. Ignoring');
        resolve();
      }
    });
  };
  /**
   * Begins graceful shutdown
   */
  public shutDown = async () => {
    logger.info(`=== Gracefully shutting down (PodId: ${POD_ID}) ===`);
    if (this.client) {
      await this.client.destroy();
      logger.info('=== Closed connection to Discord ===');
    }
    const closingDb = mongoose.disconnect();
    closingDb.then(() => {
      logger.info('=> Database connection closed');
    });
    const closingBotManagerConnection = this.closeBotManagerConnection();

    await P.all([closingDb, closingBotManagerConnection]);
  };
  /**
   * Assigns all the bot's event listeners
   */
  private setupEventListeners = () => {
    if (!isDiscordClient(this.client)) {
      return;
    }

    this.client.on('error', eventAsyncCatcher('error')(this.onError));
    this.client.on('ready', eventAsyncCatcher('ready')(this.onReady));
    this.client.on('warn', eventAsyncCatcher('warn')(this.onWarn));
    this.client.on('message', eventAsyncCatcher('message')(this.onMessage));
    this.client.on(
      'guildCreate',
      eventAsyncCatcher('guildCreate')(this.onGuildCreate)
    );
    this.client.on(
      'guildDelete',
      eventAsyncCatcher('guildDelete')(this.onGuildDelete)
    );
    this.client.on(
      'guildMemberAdd',
      eventAsyncCatcher('guildMemberAdd')(this.onGuildMemberAdd)
    );
    this.client.on(
      'guildMemberRemove',
      eventAsyncCatcher('guildMemberRemove')(this.onGuildMemberRemove)
    );
    this.client.on(
      'roleCreate',
      eventAsyncCatcher('roleCreate')(this.onRoleCreate)
    );
    this.client.on(
      'roleUpdate',
      eventAsyncCatcher('roleUpdate')(this.onRoleUpdate)
    );
    this.client.on(
      'roleDelete',
      eventAsyncCatcher('roleDelete')(this.onRoleDelete)
    );
  };
  /**
   * Called when bot has finished initializing
   */
  private onReady = async () => {
    if (!isDiscordClient(this.client)) {
      return;
    }
    this.teamDiscord = this.client.guilds.get(BOT_ALCHEMY_DISCORD_ID) || null;
    if (this.markStarted) {
      this.markStarted();
    }

    const guildsCount = this.client.guilds.array().length;
    logger.info(`
      *****************************************
      * Bot Connected successfully (${VERSION})
      * ---------------------------------------
      * ShardId: ${this.shardId}
      * Guilds Active: ${guildsCount}
      * Log level: ${logger.level}
      * NODE_ENV: ${process.env.NODE_ENV}
      * DEBUG: ${process.env.DEBUG}
      * Log channel name: ${BOT_ALCHEMY_LOG_CHANNEL_NAME}
      *****************************************
    `);

    podStatusServer.ready();

    this.updatePresenceStatus(`referralranks.com - ${VERSION}`);
  };
  /**
   * When a Discord message arrives to a guild
   */
  private onMessage = async (message: Discord.Message) => {
    const { guild } = message;

    // Ignore direct messages for now
    if (!guild) {
      return;
    }

    const { id: guildDiscordId } = guild;
    const prefix = await cache.getPrefix(guildDiscordId, commandManager.prefix);
    const result = await commandManager.processMessage(message, { prefix });

    if (result.code === ProcessMessageResultCodes.NON_COMMAND) {
      return;
    }

    logger.debug(`Received command:\n${message.content}`);

    if (result.code !== ProcessMessageResultCodes.FINISHED) {
      logger.debug(`
        Code: ${result.code}
        Message: ${message.content}
      `);
    }
  };
  /**
   * When the bot is added to a new guild
   */
  private onGuildCreate = async (guild: Discord.Guild) => {
    this.reportGuildCreateToManager(guild);
    if (isGuildUnavailable(guild)) {
      return;
    }
    await this.saveGuild(guild);
    await this.saveBotInstance(guild);
    await this.sendGreetingMessageToGuildOwner(guild);
  };
  /**
   * When the bot is removed from a guild
   */
  private onGuildDelete = async (guild: Discord.Guild) => {
    logger.info(`Removed from discord: ${guild.name} (ID: ${guild.id})`);
    this.reportGuildDeleteToManager(guild);
    await this.saveBotInstance(guild, true);
  };
  /**
   * When a member joins a guild
   * Note: Not necessarily for the first time
   */
  private onGuildMemberAdd = async (member: Discord.GuildMember) => {
    logger.info(`>> New member joined: ${member.guild.name}`);
    await attemptToAssociateInviteToUser(member);
    await this.processGuildInvites(member.guild);
  };
  /**
   * When a member leaves a guild
   */
  private onGuildMemberRemove = async (member: Discord.GuildMember) => {
    logger.info('>> Member removed', member);
    await this.saveGuild(member.guild);
  };
  /**
   * When a new role is created
   */
  private onRoleCreate = async ({ guild }: Discord.Role) => {
    logger.info(`>> New role created: ${guild.name}`);
    await this.upsertRoles(guild);
  };
  /**
   * When a role is deleted
   */
  private onRoleDelete = async (role: Discord.Role) => {
    const { guild } = role;
    logger.info(`>> Role deleted: ${guild.name}`);
    await this.deleteRankForRole(role);
    await this.deleteOldRoles(guild);
    await this.upsertRoles(guild);
  };
  /**
   * When a role is updated
   */
  private onRoleUpdate = async ({ guild }: Discord.Role) => {
    logger.debug(`>> Role updated: ${guild.name}`);
    await this.upsertRoles(guild);
  };
  /**
   * When an error occurs while communicating with Discord
   */
  private onError = async (error: Error) => {
    logger.error(error.message);
  };
  /**
   * when a warning occurs while communicating with Discord
   */
  private onWarn = async (info: string) => {
    logger.warn(info);
  };
}

export const bot = new Bot();
