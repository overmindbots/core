import { Command } from '@overmindbots/discord.js-command-manager';
import { BotInstance } from '@overmindbots/shared-models';
import { getUserInviteLinkUrl } from '@overmindbots/shared-utils/botReferralRanks';
import Discord from 'discord.js';
import { BOT_TYPE } from '~/constants';
export class LinkCommand extends Command {
  public static keywords = ['link', 'invite', 'invite-link'];
  public async run({ guild, channel, author }: Discord.Message) {
    const botInstance = await BotInstance.findOrCreate(guild, BOT_TYPE);
    if (!botInstance.config.isNextVersion) {
      return;
    }
    await channel.send(
      `${author}\n\nYour personal invite link is \`${getUserInviteLinkUrl(
        guild.id,
        author.id
      )}\``
    );
  }
}
