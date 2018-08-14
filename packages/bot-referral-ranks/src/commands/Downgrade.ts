import {
  Command,
  DiscordPermissions,
} from '@overmindbots/discord.js-command-manager';
import { BotInstance } from '@overmindbots/shared-models';
import { CertainReferral } from '@overmindbots/shared-models/referralRanks';
import { awaitConfirmation } from '@overmindbots/shared-utils/bots';
import Discord from 'discord.js';
import { BOT_TYPE } from '~/constants';

export class DowngradeCommand extends Command {
  public static keywords = ['downgrade', 'rollback'];
  public static permissionsRequired = [DiscordPermissions.ADMINISTRATOR];
  public async run({ channel, guild }: Discord.Message) {
    let botInstance;
    botInstance = await BotInstance.findOrCreate(guild, BOT_TYPE);
    const isUsingNextVersion = botInstance.config.isNextVersion;

    if (!isUsingNextVersion) {
      await channel.send(
        'You are using the legacy invites system.\n' +
          'If you meant to upgrade to the new system use the `!upgrade` command'
      );
      return;
    }

    await channel.send(
      'Are you **really sure** you want to downgrade ' +
        'to the old invites system?\n\n' +
        '👉 You will no longer be able to access the new features that come ' +
        'with this version\n' +
        '👉 I will no longer be counting people who join through custom ' +
        'invite links\n' +
        '👉 You can always upgrade again with the `!upgrade` command\n\n' +
        'To downgrade reply `yes`, to abort reply with anything else'
    );

    const confirmed = await awaitConfirmation(this.message);

    if (!confirmed) {
      return;
    }
    // Get botInstance again to avoid invalid state
    botInstance = await BotInstance.findOrCreate(guild, BOT_TYPE);
    if (!botInstance) {
      return;
    }

    // Delete existing artificial referral records if there are any and bulk insert
    await CertainReferral.deleteMany({
      guildDiscordId: guild.id,
      artificial: true,
    });

    await BotInstance.updateOne(
      { guildDiscordId: guild.id, botType: BOT_TYPE },
      {
        $set: {
          'config.isNextVersion': false,
        },
      }
    );

    await channel.send(
      'You have downgraded to the legacy invites system 😢.\n You can always ' +
        'upgrade to the new system and enjoy its awesome new features with' +
        ' the `!upgrade` command.'
    );
  }
}
