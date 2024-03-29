// Move this to shared code
if (!process.env.DISCORD_CLIENT_SECRET) {
  throw new Error('Missing env variable DISCORD_CLIENT_SECRET');
}
if (!process.env.DISCORD_CLIENT_ID) {
  throw new Error('Missing env variable DISCORD_CLIENT_ID');
}
if (!process.env.MONGODB_URI) {
  throw new Error('Missing env variable MONGODB_URI');
}
if (!process.env.NODE_ENV) {
  throw new Error('Missing env variable NODE_ENV');
}
if (!process.env.API_URL) {
  throw new Error('Missing env variable API_URL');
}
if (!process.env.BOT_TOKEN) {
  throw new Error('Missing env variable BOT_TOKEN');
}
if (!process.env.PORT) {
  throw new Error('Missing env variable PORT');
}
if (!process.env.DEPLOYMENT_STAGE) {
  throw new Error('Missing env variable DEPLOYMENT_STAGE');
}

export const DISCORD_CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET;
export const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID;
export const MONGODB_URI = process.env.MONGODB_URI;
export const API_URL = process.env.API_URL;
export const OAUTH_CALLBACK_URL = `${API_URL}/oauth/callback`;
export const DISCORD_INVITE_PREFIX = 'https://discord.gg';
export const OAUTH_AUTHORIZATION_URL =
  'https://discordapp.com/api/oauth2/authorize';
export const OAUTH_TOKEN_URL = 'https://discordapp.com/api/oauth2/token';
export const PORT = process.env.PORT;
export const BOT_TOKEN = process.env.BOT_TOKEN;
export const DEPLOYMENT_STAGE = process.env.DEPLOYMENT_STAGE;
