// tslint:disable completed-docs
import {
  Command,
  CommandRuntimeError,
} from '@overmindbots/discord.js-command-manager';
import { BotInstance } from '@overmindbots/shared-models';
import {
  CertainReferral,
  Rank,
} from '@overmindbots/shared-models/referralRanks';
import { getUserInviteLinkUrl } from '@overmindbots/shared-utils/botReferralRanks';
import { reduce as reduceNormal } from 'lodash';
import { add, flow, map as mapFp, reduce } from 'lodash/fp';
import moment from 'moment';
import pluralize from 'pluralize';
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
  /**
   * Returns data of the closest role where the invites required
   * are bigger than the number provided
   */
  private getNextRoleInfo = async (invitesCount: number) => {
    const { guild } = this.message;
    const rank = await Rank.getNextRank(invitesCount, guild);

    if (!rank) {
      return null;
    }
    const invitesForNextRole = rank.invitesRequired - invitesCount;
    const nextRole = guild.roles.find('id', rank.roleDiscordId);
    const nextRoleName = (nextRole && nextRole.name) || 'DeletedRole';
    return { invitesForNextRole, nextRoleName };
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

    const nextRoleData = await this.getNextRoleInfo(invitesCount);

    if (nextRoleData) {
      nextRankMessage =
        `\nYou need ${nextRoleData.invitesForNextRole} more ${pluralize(
          'invite',
          nextRoleData.invitesForNextRole
        )} to become` + ` **${nextRoleData.nextRoleName}**`;
    }
    if (expireableLinksCount) {
      expireableInvitesWarningMessage =
        '\n**Warning:** You have invite links ' +
        'that are expireable, this means that ' +
        `${expireableInivites} ${pluralize(
          'invite',
          expireableInivites
        )} will be deleted` +
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
    const getScoreSince = botInstance.config.countScoresSince || new Date(0);
    const sinceTimestamp = getScoreSince.getTime();
    const member = guild.member(author);
    const score = await CertainReferral.getMemberScore(member, getScoreSince);

    let sinceText = '';
    let invitesRequiredText = '';
    const nextRoleInfo = await this.getNextRoleInfo(score);
    if (nextRoleInfo) {
      invitesRequiredText = `\n- You need \`${
        nextRoleInfo.invitesForNextRole
      }\` ${pluralize('invite', nextRoleInfo.invitesForNextRole)} to become **${
        nextRoleInfo.nextRoleName
      }**`;
    }
    if (sinceTimestamp !== 0) {
      const days = Math.floor(
        moment.duration(Date.now() - sinceTimestamp).asDays()
      );
      sinceText = ` in the last \`${days} days\``;
    }
    await channel.send(
      `**${author.username}**\n` +
        `- You have invited \`${score} ${pluralize(
          'member',
          score
        )}\`${sinceText}\n` +
        `- Your invite link is \`${getUserInviteLinkUrl(
          guild.id,
          author.id
        )}\`` +
        `${invitesRequiredText}`
    );
  }
}
