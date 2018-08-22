import { APP_REFERRAL_RANKS_INVITE_WRAPPER_URL } from '@overmindbots/shared-utils/constants';

export function getUserInviteLinkUrl(
  guildDiscordId: string,
  userDiscordId: string
) {
  return (
    `${APP_REFERRAL_RANKS_INVITE_WRAPPER_URL}/invite/` +
    `${guildDiscordId}/${userDiscordId}`
  );
}
