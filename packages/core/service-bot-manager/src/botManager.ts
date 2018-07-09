import http from 'http';
import { each, filter, find, findKey, range } from 'lodash';
import mongoose from 'mongoose';
import {
  connection as WebsocketConnection,
  server as WebSocketServer,
  IMessage,
} from 'websocket';
import logger from 'winston';
import {
  BOT_MANAGER_SERVICE_HOST,
  BOT_MANAGER_SERVICE_PORT,
} from '~/constants';
import { podStatusServer } from '~/podStatusServer';
import {
  ClientMsgTypes,
  HandshakeClientMsg,
  HandshakeServerMsg,
  LogToTeamServerMsg,
  ReportGuildCreateClientMsg,
  ReportGuildDeleteClientMsg,
  ServerMsgTypes,
  ServiceClientMessage,
  ShardReadyClientMsg,
  ShardShuttingDownClientMsg,
} from '~/shared/serviceMessageTypes';

interface EnhancedConnection extends WebsocketConnection {
  shardId?: number;
}

interface ShardData {
  podId: string;
  connection: EnhancedConnection;
  guildCount: number;
  memberCount: number;
  ready: boolean;
  hasTeamDiscord: boolean;
  reservedBy: null | string;
}
interface ShardsData {
  shards: {
    [shardId: number]: ShardData | null;
  };
}
interface UTF8Message extends IMessage {
  utf8Data: string;
}

function isUTF8Message(message: IMessage): message is UTF8Message {
  return message.type === 'utf8';
}

export class BotManager {
  public wss: WebSocketServer;
  public httpServer: http.Server;
  private shardsData: ShardsData;
  private totalShards: number;

  constructor(totalShards: number) {
    logger.info(`
      == Booting Websocket ==
      PORT: ${BOT_MANAGER_SERVICE_PORT}
      IP: ${BOT_MANAGER_SERVICE_HOST}
    `);
    this.httpServer = http.createServer(function(request: any, response: any) {
      logger.info(`${new Date()} Received request for: ${request.url}`);
      response.writeHead(404);
      response.end();
    });
    this.wss = new WebSocketServer({
      httpServer: this.httpServer,
    });

    this.shardsData = {
      shards: {},
    };
    this.totalShards = totalShards;
    each(range(0, totalShards), shardId => {
      this.shardsData.shards[shardId] = null;
    });
  }
  public async start() {
    const initializingWebSocket = this.initializeWebsocket();
    const initializingHttpServer = this.initializeHttpServer();
    await Promise.all([initializingWebSocket, initializingHttpServer]);
    podStatusServer.ready();
  }
  private initializeHttpServer() {
    return new Promise(resolve => {
      this.httpServer.listen(BOT_MANAGER_SERVICE_PORT, function() {
        resolve();
      });
    });
  }
  private initializeWebsocket() {
    this.wss.on('request', (request: any) => {
      const connection: EnhancedConnection = request.accept(
        undefined,
        request.origin
      );

      logger.info('>> New web socket connection accepted');

      connection.on('message', async (message: any) => {
        if (!isUTF8Message(message)) {
          return;
        }
        const data = JSON.parse(message.utf8Data) as ServiceClientMessage;

        logger.info(`Websocket message arrived: ${data.type}`);

        switch (data.type) {
          case ClientMsgTypes.HANDSHAKE: {
            this.onHandshakeClientMsg(data, connection);
            break;
          }
          case ClientMsgTypes.SHARD_READY: {
            this.onShardReadyClientMsg(data, connection);
            break;
          }
          case ClientMsgTypes.REPORT_GUILD_CREATE: {
            this.onReportGuildCreateClientMsg(data, connection);
            break;
          }
          case ClientMsgTypes.REPORT_GUILD_DELETE: {
            this.onReportGuildDeleteClientMsg(data, connection);
            break;
          }
          case ClientMsgTypes.SHARD_SHUTTING_DOWN: {
            this.onShardShuttingDown(data, connection);
            break;
          }
          default: {
            logger.warn(
              `Unknown message type received of type ${(data as any).type}`
            );
          }
        }
      });

      connection.on('close', async () => {
        logger.info(`==> Connection closing  ${connection.shardId}`);
        if (connection.shardId === undefined) {
          logger.warn('A connection without shardId closed');
          return;
        }
        const shard = this.getShard(connection.shardId);
        if (!shard) {
          return;
        }
        logger.info(
          `>> Shard disconnected (ID: ${shard} | PodID: ${shard.podId})`
        );
        this.reserveShard(connection.shardId, shard.podId);
        this.updateStatusToConsole();

        // this.shardsData.shards[connection.shardId] = null;
        this.logToTeamDiscord(
          `Shard ${connection.shardId} has disconnected from Bot Manager`
        );
      });
    });
  }
  private sendMessage(connection: EnhancedConnection, message: any) {
    connection.send(JSON.stringify(message));
  }
  private updateStatusToConsole() {
    let logToDiscord = '\n\n** Active Shards**\n\n';
    const { totalShards } = this.getActiveShardsStats();
    logger.info('\n');
    logger.info('== Status update ==');
    logger.info(`= Active shards ${totalShards}`);
    each(this.shardsData.shards, (shard, shardId) => {
      if (!shard) {
        logToDiscord += `⚡ Shard \`${shardId}\`: 🔴 OFF\n`;
        return;
      } else if (shard.reservedBy) {
        logToDiscord += `⚡ Shard \`${shardId}\`: ⚫ RESERVED - *${
          shard.podId
        }*\n`;
      } else {
        const { guildCount, podId } = shard;
        logToDiscord += `⚡ Shard \`${shardId}\`: 🔵 ON - *${podId}*\n`;
        logger.info(
          `= Shard ${shardId}: Servers: ${guildCount} | PodId: ${podId}`
        );
      }
    });
    const reservedShards = filter(
      this.shardsData.shards,
      shard => !!shard && !!shard.reservedBy
    );
    if (reservedShards.length) {
      logger.info(`=== Reserved shards ${reservedShards.length} ===`);
    }
    each(reservedShards, (shard, shardId) => {
      if (!shard || !shard.reservedBy) {
        return;
      }
      logger.info(`- Shard ${shardId}: Reserved`);
    });
    logToDiscord += '\n\n';
    this.logToTeamDiscord(logToDiscord);
  }
  private getFreeShardId(requestedShardId?: number) {
    if (requestedShardId !== undefined) {
      const shard = this.getShard(requestedShardId);
      if (shard) {
        throw new Error(
          `Requested a shardId that is not free. (shardId: ${requestedShardId})`
        );
      }
      return requestedShardId;
    }
    const key = findKey(this.shardsData.shards, shard => !shard);
    if (key) {
      return parseInt(key, 10);
    }
    return null;
  }
  private getLoggerShard() {
    return find(this.shardsData.shards, { hasTeamDiscord: true });
  }
  private logToTeamDiscord(message: string) {
    const loggerShard = this.getLoggerShard();
    if (!loggerShard) {
      return;
    }

    const loggerShardConnection = loggerShard.connection;
    const messageToSend: LogToTeamServerMsg = {
      type: ServerMsgTypes.LOG_TO_TEAM,
      payload: message,
    };

    logger.debug("Logging message to Team's Discord");
    this.sendMessage(loggerShardConnection, messageToSend);
  }
  private getActiveShardsStats() {
    let totalShards = 0;
    let totalMembers = 0;
    let totalGuilds = 0;
    each(this.shardsData.shards, shard => {
      if (!shard || shard.reservedBy) {
        return;
      }
      totalMembers += shard.memberCount;
      totalGuilds += shard.guildCount;
      totalShards++;
    });
    return { totalShards, totalMembers, totalGuilds };
  }
  private getShard(shardId?: number) {
    if (shardId === undefined) {
      return null;
    }
    return this.shardsData.shards[shardId];
  }
  private onReportGuildCreateClientMsg(
    { payload: { memberCount, name } }: ReportGuildCreateClientMsg,
    connection: EnhancedConnection
  ) {
    const { shardId } = connection;
    const shard = this.getShard(shardId);
    if (!shard) {
      return;
    }

    shard.guildCount += 1;
    shard.memberCount += memberCount;
    const { totalGuilds, totalMembers } = this.getActiveShardsStats();

    this.logToTeamDiscord(
      '\n🎊 **New Discord Guild! ** 🎊\n\n' +
        `**Name:** ${name}\n` +
        `**Members:** ${memberCount}\n` +
        `\`\`\`\nTotal guilds: ${totalMembers}\n` +
        `We now reach: ${totalGuilds} people around the world!\n\`\`\`\n\n`
    );
  }
  private onReportGuildDeleteClientMsg(
    { payload: { memberCount, name } }: ReportGuildDeleteClientMsg,
    connection: EnhancedConnection
  ) {
    const { shardId } = connection;
    const shard = this.getShard(shardId);
    if (!shard) {
      return;
    }

    shard.guildCount -= 1;
    shard.memberCount -= memberCount;
    const { totalGuilds } = this.getActiveShardsStats();

    this.logToTeamDiscord(
      '\n⚫️ ** Removed from Discord Guild** ⚫️\n' +
        `**Name:** ${name}\n` +
        `**Members:** ${memberCount}\n` +
        `\`\`\`\nTotal guilds now: ${totalGuilds}\n\`\`\`\n\n`
    );
  }
  private freeShard(shardId: number, podId: string) {
    const shard = this.getShard(shardId);
    if (!shard) {
      return;
    }
    if (shard.podId !== podId) {
      return;
    }
    this.shardsData.shards[shardId] = null;
  }
  private reserveShard(shardId: number, podId: string) {
    const shard = this.getShard(shardId);
    if (!shard) {
      throw new Error(`Tried to reserve non-assigned shard to podId: ${podId}`);
    }
    shard.reservedBy = podId;
  }
  private onShardShuttingDown(
    { payload: { shardId, podId } }: ShardShuttingDownClientMsg,
    connection: EnhancedConnection
  ) {
    logger.info(
      `==> Shard shutting down | ShardId:${shardId} | podId ${podId}`
    );

    if (shardId === undefined) {
      return;
    }
    this.freeShard(shardId, podId);
    connection.close();
    logger.info(
      `== Shutdown shard gracefully (shardId: ${shardId} | podId: ${podId})`
    );
    this.updateStatusToConsole();
  }
  private findReservedShard(podId: string) {
    return find(this.shardsData.shards, shard => {
      if (!shard) {
        return false;
      }
      return shard.reservedBy === podId;
    });
  }
  private getShardIdFromPodId(podId: string) {
    const key = findKey(
      this.shardsData.shards,
      item => !!(item && item.podId === podId)
    );
    if (key) {
      return parseInt(key, 10);
    }
    return null;
  }
  private onHandshakeClientMsg(
    { payload: { podId, shardId: requestedShardId } }: HandshakeClientMsg,
    connection: EnhancedConnection
  ) {
    logger.debug(
      `Handshake received by ${podId}. shardIdRequested: ${
        requestedShardId !== undefined ? requestedShardId : 'none'
      }`
    );
    const reservedShard = this.findReservedShard(podId);
    let shardId;
    if (reservedShard) {
      shardId = this.getShardIdFromPodId(podId);
      if (shardId === null) {
        throw new Error('Got a reserved shard id with no podId');
      }
      logger.info(`Resumed connection with Pod: ${podId}`);
      reservedShard.reservedBy = null;
      connection.shardId = shardId;
    } else {
      shardId = this.getFreeShardId(requestedShardId);
      if (shardId === null) {
        const reservedShardId = findKey(
          this.shardsData.shards,
          shard => !!(shard && shard.reservedBy)
        );
        if (!reservedShardId) {
          logger.warn(
            'A shard requested a shardId even though there are no vacancies'
          );
          return;
        }
        shardId = parseInt(reservedShardId, 10);
      }
      connection.shardId = shardId;
      this.shardsData.shards[shardId] = {
        podId,
        connection,
        guildCount: 0,
        memberCount: 0,
        ready: false,
        hasTeamDiscord: false,
        reservedBy: null,
      };
    }

    const messageToSend: HandshakeServerMsg = {
      type: ServerMsgTypes.HANDSHAKE,
      payload: { shardId, totalShards: this.totalShards },
    };

    this.sendMessage(connection, messageToSend);
    this.updateStatusToConsole();
  }
  private onShardReadyClientMsg(
    data: ShardReadyClientMsg,
    connection: EnhancedConnection
  ) {
    const {
      payload: { guildCount, memberCount, hasTeamDiscord },
    } = data;
    const shardId = connection.shardId;
    const shard = this.getShard(shardId);
    if (!shard) {
      return;
    }
    shard.memberCount = memberCount;
    shard.guildCount = guildCount;
    shard.hasTeamDiscord = hasTeamDiscord;

    logger.debug(`Shard ${shardId} is ready - podId: ${shard.podId}`);
    const { totalShards } = this.getActiveShardsStats();
    if (totalShards === this.totalShards) {
      this.logToTeamDiscord(`\n✅ All \`${this.totalShards}\` shards ready.`);
    }
    this.updateStatusToConsole();
  }
  private async closeWebSocketServer() {
    this.wss.closeAllConnections();
    await new Promise(resolve => {
      setTimeout(() => {
        logger.info('Closed web socket server');
        resolve();
      }, 5 * 1000);
    });
  }
  private async closeHttpServer() {
    await new Promise(resolve => {
      this.httpServer.close(() => {
        logger.info('Closed http server');
        resolve();
      });
    });
  }
  private async closeDatabase() {
    await new Promise(resolve => {
      mongoose.connection.close().then(() => {
        logger.info('Closed database connection');
        resolve();
      });
    });
  }
  public async shutDown() {
    this.logToTeamDiscord('\n⬇️ Shutting Bot Manager down');
    const closingWebSocketServer = this.closeWebSocketServer();
    const closingHttpServer = this.closeHttpServer();
    const closingDatabase = this.closeDatabase();
    await Promise.all([
      closingWebSocketServer,
      closingHttpServer,
      closingDatabase,
    ]);
    process.exit(0);
  }
}
