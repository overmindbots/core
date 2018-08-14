export enum BOT_TYPES {
  REFERRAL_RANKS = 'REFERRAL_RANKS',
}
export interface ReferralRanksBotConfig {
  prefix: string;
  leaderboardSize?: number;
  isNextVersion?: boolean;
  countScoresSince: Date;
}

export const POD_STATUS_SERVER_PORT =
  process.env.POD_STATUS_SERVER_PORT || 7000;

export const APP_REFERRAL_RANKS_INVITE_WRAPPER_URL = process.env
  .APP_REFERRAL_RANKS_INVITE_WRAPPER_URL as string;

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

export const REFERRAL_RANKS_DEFAULT_LEADERBOARD_SIZE = 50;
export const REFERRAL_RANKS_INVITE_BASE_URL = '${}';

/**
 * Number after which Discord considers a guild "big"
 * this means that by default we don't have a full in-memory list of members
 * and need to fetch them if we require it
 */
export const DISCORD_BIG_GUILD_MEMBER_SIZE = 250;

export const API_VERSION = 7;
export const DISCORD_API_BASE_URL = `https://discordapp.com/api/v${API_VERSION}`;
export const DISCORD_OAUTH_BASE_URL = `${DISCORD_API_BASE_URL}/oauth2`;
export const PREFIX_PATTERN = /^([^\s@#"'*a-z0-9*`]){1}$/;
export const DISCORD_CDN_URL = 'https://cdn.discordapp.com';
export const DISCORD_BASE_ADD_BOT_URL =
  'https://discordapp.com/oauth2/authorize';
