// tslint:disable completed-docs
import {
  Command,
  CommandRuntimeError,
  DiscordPermissions,
} from '@overmindbots/discord.js-command-manager';
import { Rank } from '@overmindbots/shared-models/referralRanks';
import Discord from 'discord.js';
import { bot } from '~/bot';
import { BOT_ROLE, DISCORD_ERROR_CODES } from '~/constants';
import { getBotHighestRolePosition, getRolesLowerThanBot } from '~/utils';

// TODO: Use generics to include args

interface Args {
  role: Discord.Role;
  invitesRequired: number;
}
export class SetRankCommand extends Command {
  public static argsPattern = '{role:Role} {invitesRequired:Number}';
  public static keywords = ['set-rank', 'add-rank', 'update-rank'];
  public static permissionsRequired = [DiscordPermissions.ADMINISTRATOR]; // Fix typing here

  public isRankLowerThanBot = (): boolean => {
    const {
      role: { position },
    } = this.args as Args;
    const { guild } = this.message;
    const ownHighestPosition = getBotHighestRolePosition(guild);
    return ownHighestPosition > position;
  };

  public sendLowerRolesErrorMessage = async () => {
    const { channel, guild } = this.message;
    const { role } = this.args as Args;
    const lowerRoles = getRolesLowerThanBot(guild);
    const lowerRolesText = lowerRoles.reduce(
      (total, { name }) => `${total}\`${name}\`\n`,
      ''
    );

    await channel.send(
      `${role.name} has to be below \`${BOT_ROLE}\` ` +
        'in the roles list.\n\n' +
        `Roles below \`${BOT_ROLE}\` are: \n\n${lowerRolesText}`
    );
  };

  public isRankEveryone = () => {
    const { role } = this.args as Args;
    const { guild } = this.message;
    return role.id === guild.id;
  };

  public onError = async (error: CommandRuntimeError) => {
    if (error.code && error.code === DISCORD_ERROR_CODES.MISSING_PERMISSIONS) {
      return true;
    }
    return false;
  };
  public async run({
    channel,
    guild,
    guild: { id: guildDiscordId },
  }: Discord.Message) {
    const { role, invitesRequired } = this.args as Args;

    const isEveryone = this.isRankEveryone();
    if (isEveryone) {
      await channel.send('Cannot set @everyone as a Rank');
      return;
    }

    const isLower = this.isRankLowerThanBot();

    if (!isLower) {
      await this.sendLowerRolesErrorMessage();
      return;
    }
    const rank = await Rank.findOneAndUpdate(
      { roleDiscordId: role.id },
      {
        guildDiscordId,
        invitesRequired,
        roleDiscordId: role.id,
      },
      { upsert: true }
    );
    if (!rank) {
      await channel.send(
        `Rank for role \`${
          role.name
        }\` has been added. Invites required: \`${invitesRequired}\`.`
      );

      await bot.processGuildInvites(guild);
      return;
    }

    await channel.send(
      `Rank for role \`${
        role.name
      }\` has been updated. It now requires: \`${invitesRequired}\` invites.`
    );
    await bot.processGuildInvites(guild);
  }
}
