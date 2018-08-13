import { DiscordPermissions } from '@overmindbots/discord.js-command-manager';
import { BOT_TYPES } from '@overmindbots/shared-utils/constants';

// TODO: Pass this through an env variable on build time
const pkginfo = require('../../package.json');

if (!process.env.SERVICE_BOT_MANAGER_SERVICE_HOST) {
  throw new Error('SERVICE_BOT_MANAGER_SERVICE_HOST missing');
}
if (!process.env.SERVICE_BOT_MANAGER_SERVICE_PORT) {
  throw new Error('SERVICE_BOT_MANAGER_SERVICE_PORT missing');
}
if (!process.env.POD_ID) {
  throw new Error('POD_ID missing');
}
if (!process.env.BOT_TOKEN) {
  throw new Error('BOT_TOKEN missing');
}
if (!process.env.MONGODB_URI) {
  throw new Error('MONGODB_URI missing');
}
if (!process.env.APP_REFERRAL_RANKS_INVITE_WRAPPER_URL) {
  throw new Error('APP_REFERRAL_RANKS_INVITE_WRAPPER_URL is missing');
}

// NOTE: For development we generate a podId with a timestamp to avoid
// colissions, improve this, we want to be able to restart pods in dev and
// have them keep their POD_ID
export const POD_ID =
  process.env.NODE_ENV === 'development'
    ? `${process.env.POD_ID}-${Date.now()}`
    : process.env.POD_ID;
export const BOT_MANAGER_SERVICE_HOST =
  process.env.SERVICE_BOT_MANAGER_SERVICE_HOST;
export const SERVICE_BOT_MANAGER_SERVICE_PORT =
  process.env.SERVICE_BOT_MANAGER_SERVICE_PORT;

export const BOT_TOKEN = process.env.BOT_TOKEN;
export const BOT_MANAGER_URL = `ws://${BOT_MANAGER_SERVICE_HOST}:${SERVICE_BOT_MANAGER_SERVICE_PORT}`;
export const MONGODB_URI = process.env.MONGODB_URI;
export const BOT_TYPE = BOT_TYPES.REFERRAL_RANKS;
export const DEFAULT_PREFIX = '!';
export const VERSION = `v${pkginfo.version}`;
export const REQUIRED_PERMISSIONS = {
  [DiscordPermissions.MANAGE_GUILD]: {
    name: 'Manage Server',
    reason: 'To get user invites',
  },
  [DiscordPermissions.MANAGE_ROLES]: {
    name: 'Manage Roles',
    reason: 'To assign roles to users',
  },
};
export const BOT_ROLE = 'Referral Ranks';
export const COLOR_CODES = {
  GOLD: '#D4AF37',
};
export enum DISCORD_ERROR_CODES {
  CANNOT_EXECUTE_DM_ACTION = 50003,
  MISSING_PERMISSIONS = 50013,
}

export const DISCORD_INVITE_URL =
  'https://discordapp.com/api/oauth2/authorize?client_id=402148688450813962&permissions=335662119&redirect_uri=https%3A%2F%2Fgist.github.com%2FNarzerus%2Feaf5a77958369ffc7da40e70c49bc87a&scope=bot';

// TODO: Move this to its own, readable file
export const BOT_GREETING_MESSAGE = `
Hey, thanks for adding **Referal Ranks** to your discord!

Before we start, something very important:
**Make sure your members create NON EXPIRING INVITES** otherwise
their invite counts WILL DISSAPEAR.
*We are currently implementing a way to keep track of expiring invites reliably*

Please read the setup instructions, common questions and known bugs at:
https://www.referralranks.com/finished

Don't forget:
- \`Referral Ranks\` role must be above any roles it wants to give
- If you remove a Role remove the rank first, we are not doing this
automatically at the moment
- Use \`!diagnose\` to detect setup problems
- You can change the bot's prefix with \`!set-prefix\`

Need help? Have suggestions? Join our discord:
https://discordapp.com/invite/azGQ2ez

Lastly:
You can get a list of commands by typing \`!help\`
`;

let logChannelName;

switch (process.env.DEPLOYMENT_STAGE) {
  case 'development': {
    logChannelName = 'development-logs';
    break;
  }
  case 'staging': {
    logChannelName = 'staging-logs';
    break;
  }
  case 'production': {
    logChannelName = 'production-logs';
    break;
  }
  default: {
    logChannelName = 'none';
  }
}

export const BOT_ALCHEMY_LOG_CHANNEL_NAME = logChannelName;
export const BOT_ALCHEMY_DISCORD_ID = '448205982430920714';
