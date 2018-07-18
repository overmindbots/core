export enum BOT_TYPES {
  REFERRAL_RANKS = 'REFERRAL_RANKS',
}
export interface ReferralRanksBotConfig {
  prefix: string;
  leaderboardSize?: number;
}

export const POD_STATUS_SERVER_PORT =
  process.env.POD_STATUS_SERVER_PORT || 7000;
// TODO: Change this to an array of permissions and generate programatically
export const BOTS = {
  [BOT_TYPES.REFERRAL_RANKS]: {
    name: 'Referral Ranks',
    permissions: '335760417',
  },
};
export enum OAUTH_PROVIDERS {
  DISCORD = 'DISCORD',
}

export const API_VERSION = 6;
export const DISCORD_API_BASE_URL = `https://discordapp.com/api/v${API_VERSION}`;
export const DISCORD_OAUTH_BASE_URL = `${DISCORD_API_BASE_URL}/oauth2`;
export const PREFIX_PATTERN = /^([^\s@#"'*a-z0-9*`]){1}$/;

export const DISCORD_BASE_ADD_BOT_URL =
  'https://discordapp.com/oauth2/authorize';
