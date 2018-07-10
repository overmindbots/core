// tslint:disable completed-docs
import {
  Command,
  CommandRuntimeError,
  DiscordPermissions,
} from '@overmindbots/discord.js-command-manager';
import { BotInstance } from '@overmindbots/shared-models';
import { PREFIX_PATTERN } from '@overmindbots/shared-utils/constants';
import { Message } from 'discord.js';
import { cache } from '~/cache';
import { BOT_TYPE, DISCORD_ERROR_CODES } from '~/constants';

interface Args {
  prefix: string;
}

export class SetPrefixCommand extends Command {
  public static keywords = ['set-prefix', 'prefix'];
  public static argsPattern = '{prefix:String}';
  public static permissionsRequired = [DiscordPermissions.ADMINISTRATOR];
  public onError = async (error: CommandRuntimeError) => {
    if (error.code && error.code === DISCORD_ERROR_CODES.MISSING_PERMISSIONS) {
      return true;
    }
    return false;
  };
  public async run({ channel, guild: { id: guildDiscordId } }: Message) {
    const { prefix } = this.args as Args;

    // TODO: Move this to library
    if (!this.validatePrefix()) {
      await channel.send(
        'Prefix passed is not allowed. Prefixes cannot be numbers' +
          ', letters or quotes.'
      );
      return;
    }

    await BotInstance.updateOne(
      { guildDiscordId, botType: BOT_TYPE },
      {
        $set: {
          'config.prefix': prefix,
        },
      }
    );

    await channel.send('Prefix updated. New prefix is `' + prefix + '`');

    cache.set(`prefixes.${guildDiscordId}`, prefix);
  }

  public validatePrefix = () => {
    const { prefix } = this.args as Args;
    const match = prefix.match(PREFIX_PATTERN);
    if (!match) {
      return false;
    }

    return true;
  };
}
