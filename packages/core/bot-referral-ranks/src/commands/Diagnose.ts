// tslint:disable completed-docs
import {
  Command,
  DiscordPermissions,
} from '@overmindbots/discord.js-command-manager';
import { Rank } from '@overmindbots/shared-models/referralRanks';
import { PermissionResolvable, Role } from 'discord.js';
import { each, includes, map } from 'lodash';
import { BOT_ROLE, REQUIRED_PERMISSIONS } from '~/constants';

import { getBotHighestRolePosition } from '~/utils';

function printMissingPermissionsMsg(
  descriptions: Array<{ name: string; reason: string }>
) {
  let message = '';
  each(descriptions, ({ name, reason }) => {
    const line = `🔑 **${name}:** *${reason}*`;
    message = `${message}${line}\n`;
  });
  return message;
}

function printUnmanageableRolesMsg(roles: Role[]) {
  return map(roles, role => `${role}`).join('\n');
}

export class DiagnoseCommand extends Command {
  public static keywords = ['diagnose'];
  public static permissionsRequired = [DiscordPermissions.ADMINISTRATOR];

  public getMissingPermissions = async () => {
    const { guild } = this.message;
    const permissionsMissing: Array<{ name: string; reason: string }> = [];
    each(REQUIRED_PERMISSIONS, (description, permission) => {
      if (!guild.me.hasPermission(permission as PermissionResolvable)) {
        permissionsMissing.push(description);
      }
    });
    return permissionsMissing;
  };

  public getUnmanageableRoles = async () => {
    const {
      guild,
      guild: { id: guildDiscordId },
    } = this.message;
    const ranks = await Rank.find({ guildDiscordId });
    const roleIds = ranks.map(({ roleDiscordId }) => roleDiscordId);
    const roles = guild.roles.filter(({ id }) => includes(roleIds, id));
    const ownHighestRolePosition = getBotHighestRolePosition(guild);
    return roles
      .filter(({ position }) => ownHighestRolePosition < position)
      .array();
  };

  public onError = async () => {
    /* noop */
  };

  public async run() {
    const { channel } = this.message;
    let message = '';

    const missingPermissions = await this.getMissingPermissions();
    if (missingPermissions.length) {
      message +=
        '❌ **Some permissions are missing**\n' +
        `${printMissingPermissionsMsg(missingPermissions)}\n`;
    }

    const unmanageableRoles = await this.getUnmanageableRoles();
    if (unmanageableRoles.length) {
      message +=
        `❌ **The following Roles must be below \`${BOT_ROLE}\`**\n` +
        `${printUnmanageableRolesMsg(unmanageableRoles)}\n`;
    }

    if (message.length) {
      await channel.send(message);
    } else {
      await channel.send('✅ Everything looks good!');
    }
  }
}
