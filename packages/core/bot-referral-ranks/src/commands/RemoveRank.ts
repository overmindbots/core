// tslint:disable completed-docs
import Discord from 'discord.js';
import {
  Command,
  CommandRuntimeError,
  DiscordPermissions,
} from '@overmindbots/discord.js-command-manager';
import { DISCORD_ERROR_CODES } from '~/constants';
import { Rank } from '@overmindbots/shared-models/referralRanks';

interface Args {
  role: Discord.Role;
}

export class RemoveRankCommand extends Command {
  public static argsPattern = '{role:Role}';
  public static keywords = ['delete-rank', 'remove-rank'];
  public static permissionsRequired = [DiscordPermissions.ADMINISTRATOR];
  public onError = async (error: CommandRuntimeError) => {
    if (error.code && error.code === DISCORD_ERROR_CODES.MISSING_PERMISSIONS) {
      return true;
    }
    return false;
  };
  public async run() {
    const { role } = this.args as Args;
    const { channel } = this.message;
    const rank = await Rank.findOne({ roleDiscordId: role.id });

    if (!rank) {
      await channel.send(`No rank associated to \`${role.name}\` exists.`);
      return;
    }

    await rank.remove();

    await channel.send(`Rank \`${role.name}\` has been removed.`);
  }
}
