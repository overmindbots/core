import P from 'bluebird';
import logger from 'winston';
import { migrations } from '~/migrations';
import { Control } from '~/shared/models/referralRanks';
// TODO: Temporary use only, make better system

export async function runMigrations() {
  let control = await Control.findOneAndUpdate(
    {},
    {},
    { upsert: true, setDefaultsOnInsert: true }
  );

  if (!control) {
    control = await Control.findOne({});
  }
  if (!control) {
    return;
  }

  const version = control.version;

  const migrationPicked = migrations.slice(version);
  if (!migrationPicked.length) {
    return;
  }

  await P.each(migrationPicked, async (migration, idx) => {
    logger.info(`Running migration "${idx + 1}`);
    if (!migration) {
      return;
    }
    await migration();
  });

  logger.info('Finished migrating');
}
