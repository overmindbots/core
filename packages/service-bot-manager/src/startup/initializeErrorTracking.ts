import Rollbar from 'rollbar';

const environment = process.env.DEPLOYMENT_STAGE || 'unknown';

const rollbar = new Rollbar({
  accessToken: process.env.ROLLBAR_ACCESS_TOKEN,
  captureUncaught: true,
  captureUnhandledRejections: true,
  environment,
});

export default rollbar;
