// tslint:disable completed-docs
import { Message, RichEmbed } from 'discord.js';
import { Command, CommandRuntimeError } from 'discord.js-command-manager';
import { flow, map, orderBy, reduce, take } from 'lodash/fp';

import { BOT_TYPE, DISCORD_ERROR_CODES } from '~/constants';
import { BotInstance } from '~/shared/models/BotInstance';

import {
  buildInvitesPerUser,
  updateUsersRanks,
  InvitesPerUser,
  InvitesPerUserItem,
} from './utils';

interface PrintableUserInvites {
  invitesUses: number;
  userId: string;
  username: string;
}

const DEFAULT_LEADERBOARD_SIZE = 50;

const mapAndSortUserInvites = (
  invites: InvitesPerUser,
  limit: number
): Array<PrintableUserInvites> =>
  flow([
    map(
      (
        { invitesUses, member: { username } }: InvitesPerUserItem,
        userId: string
      ) => ({
        invitesUses,
        userId,
        username,
      })
    ),
    orderBy(({ invitesUses }) => invitesUses, ['desc']),
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

  public buildMessage = (userInvites: Array<PrintableUserInvites>): string => {
    let count = 0;
    return flow([
      map(
        ({ username, invitesUses }) =>
          `${++count} 🔸 **${username}** *${invitesUses} invites*`
      ),
      reduce((prev, next) => `${prev}${next}\n`, ''),
    ])(userInvites);
  };

  public async run() {
    const { guild, channel } = this.message;
    const invites = await guild.fetchInvites();
    const userInvitesMaps = buildInvitesPerUser(invites);
    const botInstance = await BotInstance.findOrCreate(guild, BOT_TYPE);
    if (botInstance == null) {
      return;
    }
    const userInvites = mapAndSortUserInvites(
      userInvitesMaps,
      botInstance.config.leaderboardSize || DEFAULT_LEADERBOARD_SIZE
    );
    const message = this.buildMessage(userInvites);
    const richEmbed = new RichEmbed();
    const embed = richEmbed.setColor('#D4AF37').setDescription(message);
    const result = (await channel.send('Top users', {
      embed,
    })) as Message;

    if (result && !result.embeds.length) {
      await channel.send(message);
    }

    await updateUsersRanks(userInvitesMaps, guild);
  }
}
