import {
  Command,
  DiscordPermissions,
} from '@overmindbots/discord.js-command-manager';
import { BotInstance } from '@overmindbots/shared-models';
import Discord from 'discord.js';
import { BOT_TYPE } from '~/constants';

import { awaitConfirmation } from '@overmindbots/shared-utils/bots';

export class UpgradeCommand extends Command {
  public static keywords = ['upgrade', 'update'];
  public static permissionsRequired = [DiscordPermissions.ADMINISTRATOR];
  public async run({ channel, guild }: Discord.Message) {
    let botInstance;
    botInstance = await BotInstance.findOrCreate(guild, BOT_TYPE);
    const isUsingNextVersion = botInstance.config.isNextVersion;
    if (isUsingNextVersion) {
      await channel.send('You are already using the new invites version');
      return;
    }

    await channel.send(
      'This command will upgrade Referral Ranks to the new invites system.\n' +
        '**You will be able to import the current invites**\n\n' +
        'Some of the features that will be enabled:\n' +
        '- **Customizable invite links**\n' +
        '- **Impossible-to-cheat system** (!cheaters command will' +
        ' be removed in future versions)\n' +
        '- Ability to **reset invites**\n' +
        '- Know who invited who\n' +
        '\nFor a complete list of changes and more info visit ' +
        'https://www.referralranks.com/next\n\n' +
        'To confirm the migration reply `yes`.'
    );

    const confirmed = await awaitConfirmation(this.message, {
      cancelMessage: `Upgrade canceled. Whenever you are ready just say \`${
        this.prefix
      }${this.keyword}\``,
    });
    if (!confirmed) {
      return;
    }

    /*
     * We get the botInstance again in case this process we reached an invalid
     * state where we migrated while waiting for a reply
     */
    botInstance = await BotInstance.findOrCreate(guild, BOT_TYPE);
    if (!botInstance) {
      return;
    }

    await BotInstance.updateOne(
      { guildDiscordId: guild.id, botType: BOT_TYPE },
      {
        $set: {
          'config.isNextVersion': true,
        },
      }
    );

    await channel.send(
      'Congratulations! You have migrated the server to the new invites ' +
        'system.\n\n' +
        '**IMPORTANT:** The new system uses our custom invite links, which ' +
        'is what allows us to flawlessly track who invited who and completely' +
        'prevent cheaters.\nFor this reason users **must share their own ' +
        'invite link** which is obtainable through the `!invite` command' +
        '\n\n' +
        'Keep in mind:\n' +
        '- If you want to initialize the scores based on the current \n' +
        'invite links use the `!import-invites` command.\n' +
        '- If you want to revert to the old system use the' +
        ' `!downgrade` command.' +
        '- Check out the `!help` command, we updated it.'
    );
  }
}
