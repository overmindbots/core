import {
  Command,
  DiscordPermissions,
} from '@overmindbots/discord.js-command-manager';
import { BotInstance } from '@overmindbots/shared-models';
import { awaitConfirmation } from '@overmindbots/shared-utils/bots';
import Discord, { TextChannel } from 'discord.js';
import { BOT_TYPE } from '~/constants';

export class ResetLeaderboardCommand extends Command {
  public static keywords = [
    'reset-leaderboard',
    'reset-leaderboards',
    'clear-leaderboard',
    'clear-leaderboards',
    'clear-invites',
    'reset-scores',
    'clear-scores',
    'reset-invites',
  ];
  public static permissionsRequired = [DiscordPermissions.ADMINISTRATOR];
  public async run({ guild, channel, author }: Discord.Message) {
    let botInstance = await BotInstance.findOrCreate(guild, BOT_TYPE);
    if (!botInstance.config.isNextVersion) {
      await channel.send(
        'To be able to reset invites this server has to be using the new ' +
          'invites system\n' +
          'Use the `!upgrade` command to use the new system!'
      );
      return;
    }

    await channel.send(
      'Are you sure you want to reset the leaderboards?\n**All scores will ' +
        'start from zero**. Reply `yes` to confirm'
    );

    const confirmed = await awaitConfirmation(channel, author);
    if (!confirmed) {
      return;
    }

    // Get botInstance again to avoid invalid state
    botInstance = await BotInstance.findOrCreate(guild, BOT_TYPE);
    if (!botInstance) {
      return;
    }

    await BotInstance.updateOne(
      { guildDiscordId: guild.id, botType: BOT_TYPE },
      {
        $set: {
          'config.countScoresSince': new Date(),
        },
      }
    );

    await channel.send('**Leaderboards have been reset!**');
  }
}
