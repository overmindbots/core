// tslint:disable completed-docs
import {
  Command,
  CommandRuntimeError,
} from '@overmindbots/discord.js-command-manager';
import { BotInstance } from '@overmindbots/shared-models';
import { getUserInviteLinkUrl } from '@overmindbots/shared-utils/botReferralRanks';
import { Rank } from '@overmindbots/shared-models/referralRanks';
import { reduce as reduceNormal } from 'lodash';
import { add, flow, map as mapFp, reduce } from 'lodash/fp';
import { BOT_TYPE, DISCORD_ERROR_CODES } from '~/constants';

import { buildInvitesPerUser, updateUsersRanks } from './utils';

export class InvitesCommand extends Command {
  public static keywords = ['invites'];
  public onError = async (error: CommandRuntimeError) => {
    if (error.code && error.code === DISCORD_ERROR_CODES.MISSING_PERMISSIONS) {
      return true;
    }
    return false;
  };
  private runLegacyCommand = async () => {
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
  };
  public async run() {
    const { guild, channel, author } = this.message;
    const botInstance = await BotInstance.findOrCreate(guild, BOT_TYPE);
    const isUsingNextVersion = botInstance.config.isNextVersion;
    if (!isUsingNextVersion) {
      await this.runLegacyCommand();
      return;
    }

    // - get fulfilled invites for current user
    // - get next rank to get / invites left
    // - provide invite link
    await channel.send(
      `Your invite link is \`${getUserInviteLinkUrl(guild.id, author.id)}\``
    );
  }
}
