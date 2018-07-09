// tslint:disable ordered-imports
import './environment';
import './initializeLogger';
import './initializeDatabase';
import resetBotInstances from './resetBotInstances';

export default async function startup() {
  await resetBotInstances();
}
