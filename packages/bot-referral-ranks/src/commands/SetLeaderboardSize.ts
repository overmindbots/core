// tslint:disable completed-docs
import { Message } from 'discord.js';
import {
  Command,
  CommandRuntimeError,
  DiscordPermissions,
} from 'discord.js-command-manager';
import { BOT_TYPE, DISCORD_ERROR_CODES } from '~/constants';
import { BotInstance } from '~/shared/models';

interface Args {
  size: number;
}

export class SetLeaderboardSizeCommand extends Command {
  public static keywords = ['set-leaderboard-size', 'set-leaderboard-limit'];
  public static argsPattern = '{size:Number}';
  public static permissionsRequired = [DiscordPermissions.ADMINISTRATOR];

  public onError = async (error: CommandRuntimeError) => {
    if (error.code && error.code === DISCORD_ERROR_CODES.MISSING_PERMISSIONS) {
      return true;
    }
    return false;
  };

  public async run({ channel, guild: { id: guildDiscordId } }: Message) {
    const { size } = this.args as Args;

    if (size < 1) {
      await channel.send('Leaderboard size cannot be less than 1.');
      return;
    }

    await BotInstance.updateOne(
      { guildDiscordId, botType: BOT_TYPE },
      {
        $set: {
          'config.leaderboardSize': size,
        },
      }
    );

    await channel.send('Leaderboard size updated. New size is `' + size + '`');
  }
}
