import {
  Command,
  CommandArgs,
  CommandRuntimeError,
  DiscordPermissions,
} from '@overmindbots/discord.js-command-manager';
import Discord from 'discord.js';
import logger from 'winston';
import { BOT_TYPE } from '~/constants';
import { BotInstance } from '../../node_modules/@overmindbots/shared-models/src';

const replyConfig = {
  maxMatches: 1,
  time: 10000,
  errors: ['time'],
};

export class UpgradeCommand extends Command {
  public static keywords = ['upgrade', 'update'];
  public static permissionsRequired = [DiscordPermissions.ADMINISTRATOR];
  public async run({ channel, author, guild }: Discord.Message) {
    let reply;
    let botInstance;
    const { id: authorId } = author;
    botInstance = await BotInstance.findOrCreate(guild, BOT_TYPE);
    const isUsingNextVersion = botInstance.config.isNextVersion;
    if (isUsingNextVersion) {
      await channel.send('You are already using the new invites version');
      return;
    }

    try {
      const collected = await channel.awaitMessages(
        ({ author: replyAuthor }: Discord.Message) =>
          replyAuthor.id === authorId,
        replyConfig
      );
      reply = collected.first();
    } catch (err) {
      logger.error(err.message, err);
      return;
    }

    await reply.channel.send(
      'This command will upgrade Referral Ranks to the new invites system.' +
        '**You will be able to import the current invites**\n\n' +
        'Some of the features that will be enabled:\n' +
        '- **Customizable invite links**\n' +
        '- **Impossible-to-cheat system** (!cheaters command will' +
        ' be removed in future versions)\n' +
        '- Ability to **Reset invites**\n' +
        '- Know who invited who\n' +
        '\nFor a complete list of changes and more info visit ' +
        'https://www.referralranks.com/next\n\n' +
        'To confirm the migration reply `yes`.'
    );

    try {
      const collected = await channel.awaitMessages(
        ({ author: replyAuthor }) => replyAuthor.id === authorId,
        replyConfig
      );
      reply = collected.first();
    } catch (err) {
      logger.error(err.message, err);
      return;
    }

    if (reply.content !== 'yes') {
      await channel.send(
        `Upgrade canceled. Whenever you are ready just say \`${this.prefix}${
          this.keyword
        }\``
      );
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
        '**IMPORTANT:** The new system uses our custom invite links, which' +
        'is what allows us to flawlessly track who invited who and completely' +
        'prevent cheaters. For this reason users **must share their own ' +
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
