import { APP_REFERRAL_RANKS_INVITE_WRAPPER_URL } from '@overmindbots/shared-utils/constants';

export function getUserInviteLinkUrl(
  guildDiscordId: string,
  userDiscordId: string,
  baseUrl: string = APP_REFERRAL_RANKS_INVITE_WRAPPER_URL
) {
  return `${baseUrl}/invite/` + `${guildDiscordId}/${userDiscordId}`;
}
