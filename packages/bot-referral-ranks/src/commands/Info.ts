import {
  Command,
  CommandRuntimeError,
  DiscordPermissions,
} from '@overmindbots/discord.js-command-manager';
import { BotInstance } from '@overmindbots/shared-models';
import {
  CertainReferral,
  Rank,
} from '@overmindbots/shared-models/referralRanks';
import Discord from 'discord.js';
import pluralize from 'pluralize';
import { BOT_TYPE, DISCORD_ERROR_CODES } from '~/constants';

interface Args {
  user: Discord.User;
}

export class InfoCommand extends Command {
  public static keywords = ['info', 'about'];
  public static argsPattern = '{user:User}';
  public static permissionsRequired = [DiscordPermissions.ADMINISTRATOR];
  public onError = async (error: CommandRuntimeError) => {
    if (error.code && error.code === DISCORD_ERROR_CODES.MISSING_PERMISSIONS) {
      return true;
    }
    return false;
  };

  public async run({ guild, channel }: Discord.Message) {
    const botInstance = await BotInstance.findOrCreate(guild, BOT_TYPE);
    if (!botInstance.config.isNextVersion) {
      return;
    }

    const { user } = this.args as Args;

    const member = guild.member(user);
    const allTimeScore = await CertainReferral.getMemberScore(
      member,
      new Date(0)
    );

    const currentRank = await Rank.getRankForInvites(allTimeScore, guild.id);
    let roleText = '';

    if (currentRank) {
      const role = guild.roles.find('id', currentRank.roleDiscordId);
      roleText = ` **[${role.name}]**`;
    }

    let invitedText =
      '👉 I have no memory of this person. ' +
      "He must have sneaked in when I wasn't looking 😱";
    const referral = await CertainReferral.findOne({
      inviteeDiscordId: user.id,
      guildDiscordId: guild.id,
      fulfilled: true,
    });

    if (referral) {
      const inviterId = referral.inviterDiscordId;

      if (inviterId) {
        const inviter = guild.members.find('id', inviterId);
        invitedText = `👉 Invited by ${inviter.displayName}`;
      }
    }

    await channel.send(
      `Info for **${user.username}**:\n\n` +
        `👉 **${allTimeScore}** total ${pluralize(
          'invite',
          allTimeScore
        )}${roleText}\n` +
        `👉 Joined at \`${member.joinedAt}\`\n` +
        invitedText
    );
  }
}
