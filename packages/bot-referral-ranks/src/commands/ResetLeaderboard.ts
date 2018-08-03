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

export class ResetLeaderboardCommand extends Command {
  public static keywords = [
    'reset-leaderboard',
    'reset-leaderboards',
    'clear-leaderboard',
    'clear-leaderboards',
    'clear-invites',
    'reset-scores',
    'clear-scores',
    'reset-invites',
  ];
  public static permissionsRequired = [DiscordPermissions.ADMINISTRATOR];
  public async run({
    guild,
    channel,
    author: { id: authorId },
  }: Discord.Message) {
    let botInstance = await BotInstance.findOrCreate(guild, BOT_TYPE);
    if (!botInstance.config.isNextVersion) {
      await channel.send(
        'To be able to reset invites this server has to be using the new ' +
          'invites system\nUse the `!upgrade` command to use the new system!'
      );
      return;
    }

    await channel.send(
      'Are you sure you want to reset the leaderboards?\n**All scores will ' +
        'start from zero**. Reply `yes` to confirm'
    );

    let reply;
    try {
      const collected = await channel.awaitMessages(
        ({ author: replyAuthor }) => {
          console.log(replyAuthor.id, authorId);
          return replyAuthor.id === authorId;
        },
        replyConfig
      );
      reply = collected.first();
    } catch (collected) {
      await channel.send('Reset aborted');
      return;
    }

    console.log('reply.content', reply.content);

    if (reply.content !== 'yes') {
      await channel.send('Reset canceled');
      return;
    }

    botInstance = await BotInstance.findOrCreate(guild, BOT_TYPE);
    // Get botInstance again to avoid invalid state
    botInstance = await BotInstance.findOrCreate(guild, BOT_TYPE);
    if (!botInstance) {
      return;
    }

    await BotInstance.updateOne(
      { guildDiscordId: guild.id, botType: BOT_TYPE },
      {
        $set: {
          'config.countScoresSince': new Date(),
        },
      }
    );

    await channel.send('**Leaderboards have been reset!**');
  }
}
