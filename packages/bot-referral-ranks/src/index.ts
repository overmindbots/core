import '~/startup';

import {
  ClientMsgTypes,
  HandshakeClientMsg,
  ServerMsgTypes,
  ServiceServerMessage,
  ShardReadyClientMsg,
} from '@overmindbots/shared-utils/serviceMessageTypes';
import { AssertionError } from 'assert';
import { once } from 'lodash';
import {
  client as WebSocketClient,
  connection as wsConnection,
  IMessage,
} from 'websocket';
import logger from 'winston';
import { bot, Bot } from '~/bot';
import { BOT_MANAGER_URL, MONGODB_URI, POD_ID } from '~/constants';
import { podStatusServer } from '~/podStatusServer';

async function _initializeBot(
  instancedBot: Bot,
  {
    shardId,
    connection,
    totalShards,
  }: {
    shardId: number;
    connection: wsConnection;
    totalShards: number;
  }
) {
  logger.info('== Initializing bot on manager connection ==');
  instancedBot.initializeBotClient(shardId, connection, totalShards);

  await instancedBot.start();
}
// Make sure any form of initialization happens only once
const initializeBotOnce = once(_initializeBot);

interface UTF8Message extends IMessage {
  utf8Data: string;
}
function isUTF8Message(message: IMessage): message is UTF8Message {
  return message.type === 'utf8';
}
/**
 * Runs after the shard is ready. Sends status data to bot manager
 */
async function sendShardStatus(connection: any) {
  await bot.starting;
  if (!bot.client || !connection) {
    throw new AssertionError();
  }
  const guildCount = bot.client.guilds.size;
  const hasTeamDiscord = !!bot.teamDiscord;
  const memberCount = bot.client.guilds.reduce((total, guild) => {
    return total + (guild.available ? guild.memberCount : 0);
  }, 0);

  const message: ShardReadyClientMsg = {
    payload: {
      guildCount,
      memberCount,
      hasTeamDiscord,
    },
    type: ClientMsgTypes.SHARD_READY,
  };
  connection.send(JSON.stringify(message));
}

const client = new WebSocketClient();
let reconnectIntervalOn = false;
let shuttingDown = false;

client.on('connect', async connection => {
  logger.info('** Connected to Bot Manager **');
  reconnectIntervalOn = false;

  // Reset listeners
  connection.removeAllListeners();

  const currentShardId = bot.shardId;
  const handshakeMessage: HandshakeClientMsg = {
    payload: { podId: POD_ID, shardId: currentShardId },
    type: ClientMsgTypes.HANDSHAKE,
  };

  connection.send(JSON.stringify(handshakeMessage));

  connection.on('close', () => {
    reconnectIntervalOn = true;
    if (shuttingDown) {
      logger.info('** Closed Bot Manager websocket successfuly **');
      return;
    }
    logger.info('** Diconnected from Bot Manager, attempting to reconnect **');
  });

  connection.on('message', async message => {
    if (!isUTF8Message(message)) {
      return;
    }

    const data = JSON.parse(message.utf8Data) as ServiceServerMessage;

    if (data.type === ServerMsgTypes.HANDSHAKE) {
      const { shardId, totalShards } = data.payload;
      initializeBotOnce(bot, { shardId, connection, totalShards });
    }
    if (data.type === ServerMsgTypes.TERMINATE) {
      logger.warn('Received terminate signal. Shutting down!');
      process.exit(0);
    }
    if (data.type === ServerMsgTypes.LOG_TO_TEAM) {
      bot.logToBotAlchemyDiscord(data.payload);
    }
  });

  // Initialize status
  await sendShardStatus(connection);
});

client.on('connectFailed', () => {
  reconnectIntervalOn = true;
});

client.connect(BOT_MANAGER_URL);

logger.info(`
  ========= BOOTING BOT SHARD ========
  * POD_ID: ${POD_ID}
  * BOT_MANAGER_URL: ${BOT_MANAGER_URL}
  * MONGODB_URI: ${MONGODB_URI}
  * Environment: ${process.env.NODE_ENV}
  ====================================
`);

logger.info('>> Connecting to Bot Manager...');

setInterval(() => {
  if (!reconnectIntervalOn || shuttingDown) {
    return;
  }

  logger.debug('>> Sending reconnect request');
  if (client.connect(BOT_MANAGER_URL)) {
    reconnectIntervalOn = false;
  }
}, 1000);

async function gracefulShutdown() {
  logger.info('** Commencting graceful shutdown **');
  shuttingDown = true;
  const botShutdown = bot.shutDown();
  const podStatusServerShutdown = podStatusServer.stop();
  await Promise.all([podStatusServerShutdown, botShutdown]);
}

// Graceful shutdown
process.on('SIGTERM', () => {
  gracefulShutdown()
    .then(() => {
      process.exit();
    })
    .catch(() => {
      process.exit(1);
    });
});
