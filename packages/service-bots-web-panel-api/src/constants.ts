export const API_VERSION = 6;
export const DISCORD_API_BASE_URL = `https://discordapp.com/api/v${API_VERSION}`;
export const DISCORD_OAUTH_BASE_URL = `${DISCORD_API_BASE_URL}/oauth2`;
export const DISCORD_CALLBACK_URL = `${
  process.env.API_URL
}/oauth2/discord/callback`;
export const DISCORD_RATE_LIMIT_TIME = 3000;
export const DISCORD_ERROR_UNAUTHENTICATED = '401: Unauthorized';
export const DISCORD_BOT_REFERRAL_RANKS_TOKEN =
  process.env.DISCORD_BOT_REFERRAL_RANKS_TOKEN;
