// tslint:disable ordered-imports
import './environment';
import './initializeLogger';
import './initializeDatabase';
import './initializeErrorTracking';
import resetBotInstances from './resetBotInstances';

export default async function startup() {
  await resetBotInstances();
}
