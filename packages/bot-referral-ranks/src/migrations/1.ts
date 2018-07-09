// tslint:disable completed-docs
import logger from 'winston';
import { DEFAULT_PREFIX } from '~/constants';
import { BotInstance } from '~/shared/models';
import { Control } from '~/shared/models/referralRanks';

export async function migration() {
  const result = await BotInstance.updateMany(
    { 'config.prefix': { $exists: false } },
    { 'config.prefix': DEFAULT_PREFIX }
  );
  logger.info(`### Migrated: ${result}`);
  await Control.update({}, { version: 1 });
}
