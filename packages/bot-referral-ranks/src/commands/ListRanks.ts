// tslint:disable completed-docs
import {
  Command,
  CommandRuntimeError,
} from '@overmindbots/discord.js-command-manager';
import { Rank } from '@overmindbots/shared-models/referralRanks';
import { RankDocument } from '@overmindbots/shared-models/referralRanks/Rank';
import { Collection, Message, RichEmbed, Role } from 'discord.js';
import Discord from 'discord.js';
import { each, filter as normalFilter, includes, reverse } from 'lodash';
import { compact, flow, map, reduce, sortBy } from 'lodash/fp';
import pluralize from 'pluralize';
import { COLOR_CODES, DISCORD_ERROR_CODES } from '~/constants';

// FIXME: Rewrite this mess

interface RankWithRoles {
  invitesRequired: number;
  role: Discord.Role;
  rank: RankDocument;
}

export class ListRanksCommand extends Command {
  public static keywords = ['ranks', 'get-ranks'];
  public getRanksWithRoles = (
    ranks: RankDocument[],
    receivedRoles: Collection<string, Role>
  ): Array<RankWithRoles> =>
    flow([
      sortBy('invitesRequired'),
      map((rank: RankDocument) => {
        const result = {
          rank,
          role: receivedRoles.find('id', rank.roleDiscordId),
        };

        return result;
      }),
      compact,
      map(({ role, rank }: { role: Role; rank: RankDocument }) => ({
        invitesRequired: rank.invitesRequired,
        role,
        rank,
      })),
    ])(ranks);

  public printRanks = (
    ranks: RankDocument[],
    receivedRoles: Collection<string, Role>
  ) => {
    const ranksWithRoles = this.getRanksWithRoles(ranks, receivedRoles);

    return flow([
      map(({ role, invitesRequired }) => {
        const roleName = (role && role.name) || '*DeletedRole*';
        return `**${roleName}** - *${invitesRequired} invites*\n`;
      }),
      reduce((line, total) => `${total}${line}`, ''),
    ])(ranksWithRoles);
  };
  public onError = async (error: CommandRuntimeError) => {
    if (error.code && error.code === DISCORD_ERROR_CODES.MISSING_PERMISSIONS) {
      return true;
    }
    return false;
  };
  public async sendNoRanksMessage() {
    const { channel } = this.message;
    await channel.send(
      `No ranks available yet, create ranks using \`${this.prefix}add-rank\``
    );
  }
  public async run() {
    const {
      guild: { roles, id: guildDiscordId },
      channel,
    } = this.message;

    const ranks = (await Rank.find({
      guildDiscordId,
    }).exec()) as RankDocument[];

    if (!ranks.length) {
      await this.sendNoRanksMessage();
      return;
    }

    const ranksWithRoles = await this.getRanksWithRoles(ranks, roles);

    // Delete ranks with no role
    const rankToDeleteIds = flow([
      map(({ role, rank }) => (role ? null : rank._id)),
      compact,
    ])(ranksWithRoles);
    await Rank.deleteMany({ id: { $in: rankToDeleteIds } });
    const filteredRanks = normalFilter(
      ranks,
      ({ _id }) => !includes(rankToDeleteIds, _id)
    );

    // Quit if no ranks are left after deleting invalid ones
    if (!filteredRanks.length) {
      await this.sendNoRanksMessage();
      return;
    }

    // Create embed message
    const embed = new RichEmbed();
    embed.setColor(COLOR_CODES.GOLD);
    each(
      reverse(this.getRanksWithRoles(filteredRanks, roles)),
      ({ role, invitesRequired }) => {
        embed.addField(
          role.name,
          `${invitesRequired} ${pluralize('invite', invitesRequired)}`
        );
      }
    );

    const result = await channel.send('Available ranks', { embed });

    if (result && !(result as Message).embeds.length) {
      await channel.send(this.printRanks(filteredRanks, roles));
    }
  }
}
