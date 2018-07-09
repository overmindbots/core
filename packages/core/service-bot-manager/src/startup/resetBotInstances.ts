import { BotInstance } from '@overmindbots/shared-models';
import logger from 'winston';

/**
 * Marks all BotInstances in the database as disabled. As shards turn on
 * they will mark the botInstances associated to the guilds they manage
 * as enabled
 */
export default async function() {
  const res = await BotInstance.update(
    {},
    {
      enabled: false,
    },
    { multi: true }
  );

  logger.info('==> Reseted botInstance states.', res);
  return res;
}
