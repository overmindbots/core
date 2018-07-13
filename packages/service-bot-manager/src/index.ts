// import http from 'http';
import startup from '~/startup';

import logger from 'winston';
import { BotManager } from '~/botManager';
import { BOT_REFERRAL_RANKS_REPLICAS_COUNT } from '~/constants';

/**
 * Returns the total amount of shards the cluster will run.
 * In development mode and outside a kubernetes cluster it will simply
 * return an arbitrary number provided through env variables, or default to 1
 * In any kubernetes environment (development or not) it will ask the k8s API
 * what amount of replicas are configured and return that
 */
async function getTotalShards() {
  return BOT_REFERRAL_RANKS_REPLICAS_COUNT;
  // }
  // const ext = new Api.Extensions(Api.config.getInCluster());
  // const namespace = ext.namespaces && (ext.namespaces('bot-alchemy') as any);
  // const deployment = await namespace.deployments.get('bot-referral-ranks');
  // return deployment.spec.replicas;
}

logger.info('=> Setting up Bot Manager...');
startup().then(async () => {
  const totalShards = await getTotalShards();
  logger.info(
    '== Bot Manager Starting== \n' + `=> Shards to run: ${totalShards}`
  );

  const botManager = new BotManager(totalShards);
  botManager.start();
  logger.info('==> Bot Manager initialized.');

  process.once('SIGTERM', () => {
    botManager.shutDown();
  });
  process.once('SIGINT', () => {
    botManager.shutDown();
  });
});
