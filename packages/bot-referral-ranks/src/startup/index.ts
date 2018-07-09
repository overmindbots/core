import P from 'bluebird';

import './setupEnvironment';

import './initializeLogger';
import { runMigrations } from './runMigrations';
import './setupDb';
import './startPodStatusServer';

export const startup = P.each(
  [runMigrations],
  async runProcess => await runProcess()
);
