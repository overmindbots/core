// tslint:disable completed-docs
import {
  Command,
  CommandRuntimeError,
} from '@overmindbots/discord.js-command-manager';
import { BotInstance } from '@overmindbots/shared-models';
import { Message, RichEmbed } from 'discord.js';
import { BOT_TYPE, DISCORD_ERROR_CODES } from '~/constants';

export class HelpCommand extends Command {
  public static keywords = ['help', 'h'];
  public onError = async (error: CommandRuntimeError) => {
    if (error.code && error.code === DISCORD_ERROR_CODES.MISSING_PERMISSIONS) {
      return true;
    }
    return false;
  };
  public async run() {
    const { guild, channel } = this.message;
    const embed = new RichEmbed();
    const botInstance = await BotInstance.findOrCreate(guild, BOT_TYPE);
    const isUsingNextVersion = botInstance.config.isNextVersion;
    const prefix = this.prefix;

    let userCommandsField =
      `**${prefix}invites**\n *Shows your current invites and how many ` +
      `you need to reach the next rank.*\n**${prefix}ranks**\n *Lists ` +
      'all available ranks and the invites they require.*\n' +
      `**${prefix}leaderboard**\n *List top users ` +
      'ranked by number of invites.*\n';

    let adminCommandsField =
      `\n**${prefix}add-rank <Role> <invitesCount>**, ` +
      `**${prefix}set-rank <Role> <invitesCount>**\n *Sets invites required ` +
      'for a certain `Role` to be obtained. If the rank already exists it ' +
      `will update it.*\n**${prefix}remove-rank <Role>**\n *Removes a rank, ` +
      'making it unobtainable through invites.*' +
      `\n**${prefix}set-prefix <prefix>**\n *Changes the bot's command ` +
      `prefix (the current prefix is \`${prefix}\`)*\n`;

    if (!isUsingNextVersion) {
      userCommandsField +=
        `**${prefix}cheaters**\n *Shows a list of ` +
        'the users with the most fake invites (invites where a user left and ' +
        'joined repeatedly to increase their invites count).*';
    } else {
      userCommandsField +=
        `**${prefix}link**\n *Shows your ` +
        'personal invite link. (**Note:** You **MUST** use this link ' +
        'or your invites will **not** be counted)*';

      adminCommandsField +=
        `**${prefix}set-leaderboard-size <size>**\n *Sets how many` +
        ` users are shown through the ${prefix}leaderboard command*` +
        `\n**${prefix}reset-leaderboard**\n *Sets all scores to zero*` +
        `\n**${prefix}info <@User>**\n *Shows who invited the tagged user ` +
        'and when, along with his score and rank*';
    }

    userCommandsField += '\n\n';
    adminCommandsField += '\n\n';

    const OthersField =
      `\n**${prefix}support**\n *Receive support to get the bot running ` +
      `correctly*\n**${prefix}getbot**\n *Get this bot in your own Discord!*`;

    embed
      .setColor('#D4AF37')
      .addField('User commands:', userCommandsField)
      .addField(
        'Admin commands (users with Administrator permission):',
        adminCommandsField
      )
      .addField('Others', OthersField);

    const helpFallback =
      `**User Commands:**\n${userCommandsField}` +
      `**Admin commands:**\n${adminCommandsField}` +
      '----\n' +
      `**Others:**\n${OthersField}`;

    const result = (await channel.send('List of available commands', {
      embed,
    })) as Message;
    if (!result.embeds.length) {
      await channel.send(helpFallback);
    }
  }
}
