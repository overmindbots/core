// tslint:disable completed-docs
import { Command, CommandRuntimeError } from '@overmindbots/discord.js-command-manager';
import { DISCORD_ERROR_CODES, VERSION } from '~/constants';

export class VersionCommand extends Command {
  public static keywords = ['version', 'get-version'];
  public onError = async (error: CommandRuntimeError) => {
    if (error.code && error.code === DISCORD_ERROR_CODES.MISSING_PERMISSIONS) {
      return true;
    }
    return false;
  };
  public async run() {
    const { channel } = this.message;
    await channel.send(`Referral Ranks Version: \`${VERSION}\``);
  }
}
