import {
  Command,
  DiscordPermissions,
} from '@overmindbots/discord.js-command-manager';
import { BotInstance } from '@overmindbots/shared-models';
import Discord from 'discord.js';
import { BOT_TYPE } from '~/constants';

const replyConfig = {
  maxMatches: 1,
  time: 10000,
  errors: ['time'],
};

export class DowngradeCommand extends Command {
  public static keywords = ['downgrade', 'rollback'];
  public static permissionsRequired = [DiscordPermissions.ADMINISTRATOR];
  public async run({ channel, author, guild }: Discord.Message) {
    let reply;
    let botInstance;
    const { id: authorId } = author;
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
        'to the old invites system?\n' +
        '- You will no longer be able to access the new features that come ' +
        'with this version\n' +
        '- I will not be counting people who join through custom ' +
        'invite links\n' +
        '- You can always upgrade again with the `!upgrade` command\n\n' +
        'To confirm reply `yes`, to abort reply with anything else'
    );

    try {
      const collected = await channel.awaitMessages(
        ({ author: replyAuthor }) => replyAuthor.id === authorId,
        replyConfig
      );
      reply = collected.first();
    } catch (collected) {
      await channel.send('Downgrade aborted');
      return;
    }

    if (reply.content !== 'yes') {
      await channel.send('Downgrade canceled');
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
          'config.isNextVersion': false,
        },
      }
    );

    await channel.send(
      'You have downgraded to the legacy invites system. You can always ' +
        'upgrade to the new system and enjoy its awesome new features with' +
        ' the `!upgrade` command.'
    );
  }
}
