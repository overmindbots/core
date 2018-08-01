// tslint:disable completed-docs
import {
  Command,
  CommandRuntimeError,
} from '@overmindbots/discord.js-command-manager';
import Discord from 'discord.js';
import { filter, flow, map, orderBy, reduce, take } from 'lodash/fp';

import { BotInstance } from '@overmindbots/shared-models/BotInstance';
import {
  CertainReferral,
  CertainReferralScore,
} from '@overmindbots/shared-models/referralRanks/CertainReferral';
import { REFERRAL_RANKS_DEFAULT_LEADERBOARD_SIZE } from '@overmindbots/shared-utils/constants';
import { BOT_TYPE, DISCORD_ERROR_CODES } from '~/constants';

import {
  buildInvitesPerUser,
  updateUsersRanks,
  InvitesPerUser,
  InvitesPerUserItem,
} from './utils';

const mapAndSortUserInvites = (
  invites: InvitesPerUser,
  limit: number
): CertainReferralScore[] =>
  flow([
    filter(({ member: { bot } }: InvitesPerUserItem) => !bot),
    map(
      (
        { invitesUses, member: { username } }: InvitesPerUserItem,
        userId: string
      ) => ({
        score: invitesUses,
        inviterDiscordId: userId,
        username,
      })
    ),
    orderBy(({ score }) => score, ['desc']),
    take(limit),
  ])(invites);

export class LeaderboardCommand extends Command {
  public static keywords = ['leaderboard', 'leaderboards', 'top'];

  public onError = async (error: CommandRuntimeError) => {
    if (error.code && error.code === DISCORD_ERROR_CODES.MISSING_PERMISSIONS) {
      return true;
    }
    return false;
  };

  public buildMessage = (scores: CertainReferralScore[]): string => {
    let count = 0;
    return flow([
      map(
        ({ username, score }: CertainReferralScore) =>
          `${++count} 🔸 **${username}** *${score} invites*`
      ),
      reduce((prev, next) => `${prev}${next}\n`, ''),
    ])(scores);
  };

  public async run() {
    const { guild } = this.message;
    const botInstance = await BotInstance.findOrCreate(guild, BOT_TYPE);
    if (botInstance == null) {
      return;
    }

    const isUsingNextVersion = botInstance.config.isNextVersion;
    const leaderboardSize =
      botInstance.config.leaderboardSize ||
      REFERRAL_RANKS_DEFAULT_LEADERBOARD_SIZE;

    let scores;
    if (isUsingNextVersion) {
      scores = await this.getLeaderboardScores(guild, leaderboardSize);
    } else {
      scores = await this.getLegacyLeaderboardInvites(guild, leaderboardSize);
    }

    this.sendMessageWithResults(scores);
  }

  private async getLeaderboardScores(guild: Discord.Guild, limit: number) {
    return await CertainReferral.getTopScores(guild, limit);
  }

  private async getLegacyLeaderboardInvites(
    guild: Discord.Guild,
    limit: number
  ) {
    const invites = await guild.fetchInvites();
    const userInvitesMaps = buildInvitesPerUser(invites);

    updateUsersRanks(userInvitesMaps, guild);

    return mapAndSortUserInvites(userInvitesMaps, limit);
  }

  private async sendMessageWithResults(scores: CertainReferralScore[]) {
    const { channel } = this.message;
    if (scores.length <= 0) {
      channel.send('There are no scores yet');
      return;
    }
    const message = this.buildMessage(scores);
    const richEmbed = new Discord.RichEmbed();
    const embed = richEmbed.setColor('#D4AF37').setDescription(message);
    const result = (await channel.send('Top users', {
      embed,
    })) as Discord.Message;

    if (result && !result.embeds.length) {
      await channel.send(message);
    }
  }
}
