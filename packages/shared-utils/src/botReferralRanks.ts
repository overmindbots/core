import { APP_REFERRAL_RANKS_INVITE_WRAPPER_URL } from '@overmindbots/shared-utils/constants';

export function getMemberInviteLink(
  userDiscordId: string,
  guildDiscordId: string
) {
  return (
    `${APP_REFERRAL_RANKS_INVITE_WRAPPER_URL}/invite/` +
    `${guildDiscordId}/${userDiscordId}`
  );
}
