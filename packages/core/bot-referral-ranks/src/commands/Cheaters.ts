// tslint:disable completed-docs
import { Command, CommandRuntimeError } from '@overmindbots/discord.js-command-manager';
import { each, map } from 'lodash';
import { compact, flow, map as mapFp, reduce } from 'lodash/fp';
import logger from 'winston';
import { DISCORD_ERROR_CODES } from '~/constants';
import { InviteUse } from '@overmindbots/shared-models/referralRanks';

/**
 * Returns a ranking of users with the most invalid invites detected
 */
export class CheatersCommand extends Command {
  public static keywords = ['cheaters'];
  public onError = async (error: CommandRuntimeError) => {
    if (
      error.code &&
      error.code === DISCORD_ERROR_CODES.CANNOT_EXECUTE_DM_ACTION
    ) {
      return true;
    }
    return false;
  };
  public buildMessage = async (
    summedInvitesArray: Array<{
      inviterDiscordId: string;
      uses: number;
    }>
  ) => {
    const { guild } = this.message;

    if (guild.memberCount > 250) {
      await guild.fetchMembers();
    }

    return flow([
      mapFp(({ inviterDiscordId, uses }) => {
        const member = guild.members.find('id', inviterDiscordId);
        if (!member) {
          logger.info(
            `${
              guild.name
            }: Member id: ${inviterDiscordId} not found (!cheaters)`
          );
          return;
        }
        return { user: member.user, uses };
      }),
      compact,
      reduce(
        (message, { user, uses }) =>
          `${message}\n**${user.username}** - ${uses - 1} fake invites\n`,
        ''
      ),
    ])(summedInvitesArray);
  };

  public async run() {
    const {
      channel,
      guild: { id: guildDiscordId },
    } = this.message;

    const inviteUses = await InviteUse.find({
      guildDiscordId,
      uses: { $gt: 1 },
    })
      .sort({ uses: -1 })
      .limit(2000)
      .exec();

    const summedInvites: {
      [inviterDiscordId: string]: number;
    } = {};

    each(inviteUses, inviteUse => {
      summedInvites[inviteUse.inviterDiscordId] =
        summedInvites[inviteUse.inviterDiscordId] || 0;
      summedInvites[inviteUse.inviterDiscordId] += inviteUse.uses;
    });
    const summedInvitesArray = map(summedInvites, (uses, inviterDiscordId) => ({
      inviterDiscordId,
      uses,
    }));

    const lines = await this.buildMessage(summedInvitesArray);
    const message = lines.length
      ? `List of (active) users with most invalid invites: \n\n${lines}`
      : 'No invalid invites detected.';

    await channel.send(message);
  }
}
