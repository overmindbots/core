// tslint:disable completed-docs
import {
  Command,
  CommandRuntimeError,
} from '@overmindbots/discord.js-command-manager';
import { Guild, Message, RichEmbed } from 'discord.js';
import { flow, map, orderBy, reduce, take } from 'lodash/fp';

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
      scores = await this.getLeaderboardScores(
        botInstance.guildDiscordId,
        leaderboardSize
      );
    } else {
      scores = await this.getLegacyLeaderboardInvites(guild, leaderboardSize);
    }

    this.sendResults(scores);
  }

  private async getLeaderboardScores(guildDiscordId: string, limit: number) {
    return await CertainReferral.getTopScores(guildDiscordId, limit);
  }

  private async getLegacyLeaderboardInvites(guild: Guild, limit: number) {
    const invites = await guild.fetchInvites();
    const userInvitesMaps = buildInvitesPerUser(invites);

    updateUsersRanks(userInvitesMaps, guild);

    return mapAndSortUserInvites(userInvitesMaps, limit);
  }

  private async sendResults(scores: CertainReferralScore[]) {
    const { channel } = this.message;
    const message = this.buildMessage(scores);
    const richEmbed = new RichEmbed();
    const embed = richEmbed.setColor('#D4AF37').setDescription(message);
    const result = (await channel.send('Top users', {
      embed,
    })) as Message;

    if (result && !result.embeds.length) {
      await channel.send(message);
    }
  }
}
