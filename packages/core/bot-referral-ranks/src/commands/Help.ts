// tslint:disable completed-docs
import {
  Command,
  CommandRuntimeError,
} from '@overmindbots/discord.js-command-manager';
import { Message, RichEmbed } from 'discord.js';
import { DISCORD_ERROR_CODES } from '~/constants';

export class HelpCommand extends Command {
  public static keywords = ['help', 'h', 'info'];
  public onError = async (error: CommandRuntimeError) => {
    if (error.code && error.code === DISCORD_ERROR_CODES.MISSING_PERMISSIONS) {
      return true;
    }
    return false;
  };
  public async run({ channel }: Message) {
    const embed = new RichEmbed();
    const userCommandsField =
      `**${
        this.prefix
      }invites**\n *Shows your current invites and how many you need ` +
      `to reach the next rank.*\n**${
        this.prefix
      }ranks**\n *Lists all available ranks ` +
      `and the invites they require.*\n**${
        this.prefix
      }leaderboard**\n *List top users ` +
      `by invites.*\n**${this.prefix}cheaters**\n *Shows a list of` +
      ' the users with most fake invites (invites where a user left and ' +
      ' joined repeatedly to increase their invites count)*.';

    const adminCommandsField =
      `\n**${this.prefix}add-rank <Role> <invitesCount>**, **${
        this.prefix
      }set-rank <Role> <invitesCount>**\n *Sets invites required for a ` +
      'certain `Role` to be obtained. If the rank already exists it ' +
      `will update it.*\n**${
        this.prefix
      }remove-rank <Role>**\n *Removes a rank from making ` +
      'it unobtainable through invites.*' +
      `\n**${this.prefix}set-prefix <prefix>**\n *Sets the bot's prefix*` +
      `\n**${this.prefix}set-leaderboard-size <size>**\n *Sets how many` +
      ` users are shown through the ${this.prefix}top command*`;
    const OthersField =
      `\n**${
        this.prefix
      }support**\n *Receive support to get the bot running correctly*` +
      `\n**${this.prefix}getbot**\n **Get this bot in your own Discord!**`;

    embed
      .setColor('#D4AF37')
      .addField('User commands', userCommandsField)
      .addField(
        'Admin commands (users with Administrator permission)',
        adminCommandsField
      )
      .addField('Others', OthersField);

    const helpFallback =
      `**User Commands:**\n${userCommandsField}` +
      `**Admin commands:**\n${adminCommandsField}` +
      '----\n' +
      `**Others:**\n${OthersField}`;

    const result = (await channel.send('List of commands available', {
      embed,
    })) as Message;
    if (!result.embeds.length) {
      await channel.send(helpFallback);
    }
  }
}
