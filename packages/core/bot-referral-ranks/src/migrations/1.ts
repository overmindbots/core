// tslint:disable completed-docs
import { BotInstance } from '@overmindbots/shared-models';
import { Control } from '@overmindbots/shared-models/referralRanks';
import logger from 'winston';
import { DEFAULT_PREFIX } from '~/constants';

export async function migration() {
  const result = await BotInstance.updateMany(
    { 'config.prefix': { $exists: false } },
    { 'config.prefix': DEFAULT_PREFIX }
  );
  logger.info(`### Migrated: ${result}`);
  await Control.update({}, { version: 1 });
}
