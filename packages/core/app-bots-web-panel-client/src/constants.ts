import { BOT_TYPES, BOTS } from '@overmindbots/shared-utils/constants';
import botIconReferralRanksImg from '~/assets/botIconReferralRanks.svg';

import {
  buildAddBotUrl,
  verifyEnvVariables,
} from '@overmindbots/shared-utils/utils';

export enum NETWORK_ERROR_TYPES {
  UNAUTHENTICATED = 'UNAUTHENTICATED',
}

export const envVars = verifyEnvVariables([
  'REACT_APP_API_URL',
  'REACT_APP_APP_URL',
  'REACT_APP_BOT_REFERRAL_RANKS_CLIENT_ID',
]);

export const REACT_APP_APP_URL = envVars.REACT_APP_APP_URL;
export const GRAPHQL_API_URL = `${envVars.REACT_APP_API_URL}/graphql`;
export const REACT_APP_BOT_REFERRAL_RANKS_CLIENT_ID =
  envVars.REACT_APP_BOT_REFERRAL_RANKS_CLIENT_ID;
export const DISCORD_CDN_URL = 'https://cdn.discordapp.com';
export const DISCORD_OAUTH_URL = `${envVars.REACT_APP_API_URL}/oauth2/discord`;
export const DISCORD_BOT_ADD_RESPONSE_URL = `${
  envVars.REACT_APP_API_URL
}/oauth2/discord/botCallback`;

export const BOT_ICONS = {
  [BOT_TYPES.REFERRAL_RANKS]: botIconReferralRanksImg,
};
export const BOT_ADD_URLS = {
  [BOT_TYPES.REFERRAL_RANKS]: ({
    redirectUrl,
    guildDiscordId,
  }: {
    redirectUrl: string;
    guildDiscordId?: string;
  }) => {
    let state = null;
    if (redirectUrl) {
      state = { redirectUrl };
    }
    return buildAddBotUrl({
      guildDiscordId,
      clientId: REACT_APP_BOT_REFERRAL_RANKS_CLIENT_ID,
      permissionsByteString: BOTS[BOT_TYPES.REFERRAL_RANKS].permissions,
      state,
      apiResponseUrl: DISCORD_BOT_ADD_RESPONSE_URL,
    });
  },
};
