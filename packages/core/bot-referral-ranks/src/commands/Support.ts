// tslint:disable completed-docs
import {
  Command,
  CommandRuntimeError,
} from '@overmindbots/discord.js-command-manager';
import { Message } from 'discord.js';
import { DISCORD_ERROR_CODES } from '~/constants';

export class SupportCommand extends Command {
  public static keywords = ['support'];
  public onError = async (error: CommandRuntimeError) => {
    if (error.code && error.code === DISCORD_ERROR_CODES.MISSING_PERMISSIONS) {
      return true;
    }
    return false;
  };
  public async run({ author }: Message) {
    const content = `
    If you need help or have sugestions, join our discord server:
    https://discord.gg/8FNEWsR

    See you there!
    `;
    await author.send(content);
  }
}
