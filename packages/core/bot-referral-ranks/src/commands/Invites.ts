// tslint:disable completed-docs
import { Command, CommandRuntimeError } from 'discord.js-command-manager';
import { reduce as reduceNormal } from 'lodash';
import { add, flow, map as mapFp, reduce } from 'lodash/fp';
import { DISCORD_ERROR_CODES } from '~/constants';
import { Rank } from '~/shared/models/referralRanks';

import { buildInvitesPerUser, updateUsersRanks } from './utils';

export class InvitesCommand extends Command {
  public static keywords = ['invites'];
  public onError = async (error: CommandRuntimeError) => {
    if (error.code && error.code === DISCORD_ERROR_CODES.MISSING_PERMISSIONS) {
      return true;
    }
    return false;
  };
  public async run() {
    const { guild, author, channel } = this.message;
    let nextRankMessage = '';
    let expireableInvitesWarningMessage = '';
    const invites = await guild.fetchInvites();
    const userInvites = invites.findAll('inviter', author);

    const expireableLinksCount = reduceNormal(
      userInvites,
      (sum, invite) => {
        if (invite.maxAge) {
          return sum + 1;
        }
        return sum;
      },
      0
    );
    const expireableInivites = reduceNormal(
      userInvites,
      (sum, invite) => {
        if (invite.maxAge) {
          return sum + invite.uses;
        }
        return sum;
      },
      0
    );

    const invitesCount = flow([
      mapFp(({ uses }: { uses: number }) => uses),
      reduce(add, 0),
    ])(userInvites);

    const rank = await Rank.getNextRank(invitesCount, guild);

    if (rank) {
      const invitesForNextRank = rank.invitesRequired - invitesCount;
      const nextRole = guild.roles.find('id', rank.roleDiscordId);
      const nextRoleName = (nextRole && nextRole.name) || 'DeletedRole';
      nextRankMessage =
        `\nYou need ${invitesForNextRank} invites to become` +
        ` **${nextRoleName}**`;
    }
    if (expireableLinksCount) {
      expireableInvitesWarningMessage =
        '\n**Warning:** You have invite links ' +
        'that are expireable, this means that ' +
        `${expireableInivites} invites will be deleted` +
        ' by Discord ';
    }

    await channel.send(
      `**${author.username}** has ${invitesCount} invites. ` +
        `${nextRankMessage}\n${expireableInvitesWarningMessage}`
    );

    const usersInvites = buildInvitesPerUser(invites);
    await updateUsersRanks(usersInvites, guild);
  }
}