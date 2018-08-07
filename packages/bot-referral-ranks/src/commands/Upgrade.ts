import {
  Command,
  DiscordPermissions,
} from '@overmindbots/discord.js-command-manager';
import { BotInstance } from '@overmindbots/shared-models';
import { CertainReferral } from '@overmindbots/shared-models/referralRanks/CertainReferral';
import { awaitConfirmation } from '@overmindbots/shared-utils/bots';
import Discord from 'discord.js';
import { compact, map } from 'lodash';
import { buildInvitesPerUser } from '~/commands/utils';
import { BOT_TYPE } from '~/constants';

export class UpgradeCommand extends Command {
  /**
   * Fetches the Guild's invites and creates CertainReferrals marked as
   * `artificial` which represent members' scores before upgrading the server
   */
  private importInvites = async () => {
    const { guild } = this.message;
    const invites = await guild.fetchInvites();
    const invitesPerUser = buildInvitesPerUser(invites);

    // Build raw documents for bulk insertion (save middleware doesn't run on bulk inserts)
    let inviteDocuments = map(
      invitesPerUser,
      ({ invitesUses, member }, userId) => {
        if (member && member.bot) {
          return null;
        }

        return {
          guildDiscordId: guild.id,
          inviterDiscordId: userId,
          count: invitesUses,
          artificial: true,
          active: true,
          fulfilled: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
      }
    );
    inviteDocuments = compact(inviteDocuments);
    await CertainReferral.insertMany(inviteDocuments);
  };

  public static keywords = ['upgrade', 'update'];
  public static permissionsRequired = [DiscordPermissions.ADMINISTRATOR];

  public async run({ channel, guild }: Discord.Message) {
    let botInstance;
    botInstance = await BotInstance.findOrCreate(guild, BOT_TYPE);
    const isUsingNextVersion = botInstance.config.isNextVersion;
    if (isUsingNextVersion) {
      await channel.send('You are already using the new invites version');
      return;
    }

    await channel.send(
      'This command will upgrade Referral Ranks to the new invites system.\n' +
        '**You will be able to import the current invites**\n\n' +
        'Some of the features that will be enabled:\n' +
        '- **Customizable invite links**\n' +
        '- **Impossible-to-cheat system** (!cheaters command will' +
        ' be removed in future versions)\n' +
        '- Ability to **reset invites**\n' +
        '- Know who invited who\n' +
        '\nFor a complete list of changes and more info visit ' +
        'https://www.referralranks.com/next\n\n' +
        'First of all, would you like to import the current invite counts?'
    );

    const importInvites = await awaitConfirmation(this.message, {
      cancelMessage: null,
    });

    if (importInvites) {
      await channel.send(
        'Okay, I will import the current invite counts when we upgrade.\n\n'
      );
    } else {
      await channel.send(
        'Roger that, the leaderboard will start from zero once we upgrade.\n\n'
      );
    }

    await channel.send("Everything's set, **are you ready to upgrade?**\n\n");

    const confirmedMigration = await awaitConfirmation(this.message, {
      cancelMessage:
        'Upgrade aborted. when you are ready to upgrade just ' +
        `say \`${this.prefix}${this.keyword}\``,
    });

    if (!confirmedMigration) {
      return;
    }

    // TODO: Migrate invites
    // - [X] Modify models to store fake invites
    // - [X] Fetch invites, transform and store in database
    // - [ ] Modify score calculations to consider `count` field
    // - [X] Delete fake invites

    /*
     * We get the botInstance again in case we reached an invalid
     * state where we migrated while waiting for a reply
     */
    botInstance = await BotInstance.findOrCreate(guild, BOT_TYPE);
    if (!botInstance) {
      return;
    }

    if (importInvites) {
      await this.importInvites();
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
        '**IMPORTANT:** The new system uses our custom invite links, which ' +
        'is what allows us to flawlessly track who invited who and completely' +
        'prevent cheaters.\nFor this reason users **must share their own ' +
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
