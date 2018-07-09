// tslint:disable completed-docs
import { Message } from 'discord.js';
import { Command, CommandRuntimeError } from 'discord.js-command-manager';
import logger from 'winston';
import { DISCORD_ERROR_CODES, DISCORD_INVITE_URL } from '~/constants';

const content = `
You can add \`Referral Ranks\` to your own Discord server by clicking the
link below:

${DISCORD_INVITE_URL}
`;

export class GetBotCommand extends Command {
  public static keywords = ['get', 'get-bot', 'getbot'];
  public onError = async (error: CommandRuntimeError) => {
    if (
      error.code &&
      error.code === DISCORD_ERROR_CODES.CANNOT_EXECUTE_DM_ACTION
    ) {
      return true;
    }
    return false;
  };
  public async run({ author }: Message) {
    try {
      await author.send(content);
    } catch (err) {
      logger.debug(`${err.message}: ${author.username}`);
    }
  }
}
