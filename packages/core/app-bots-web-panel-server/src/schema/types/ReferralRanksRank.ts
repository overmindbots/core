import { BotInstance, Guild, Role } from '@overmindbots/shared-models';
import { RankDocument } from '@overmindbots/shared-models/referralRanks/Rank';
import { BOT_TYPES } from '@overmindbots/shared-utils/constants';
import {
  GraphQLInt,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from 'graphql';
import { globalIdField } from 'graphql-relay';
import { nodeInterface } from '~/schema/interfaces/nodeDefinitions';
import ReferralRanksType from '~/schema/types/BotInstance/ReferralRanks';
import GuildType from '~/schema/types/Guild';
import RoleType from '~/schema/types/Role';

export default new GraphQLObjectType({
  name: 'ReferralRanksRank',
  description: "a BotInstance's Rank",
  interfaces: [nodeInterface],
  fields: () => ({
    id: globalIdField('ReferralRanksRank'),
    roleDiscordId: {
      description: "Discord's Id for this Rank's Role",
      type: new GraphQLNonNull(GraphQLString),
    },
    invitesRequired: {
      description:
        "How many invites are required for this rank's Role to be" +
        ' assigned to a user',
      type: new GraphQLNonNull(GraphQLInt),
    },
    role: {
      type: RoleType,
      resolve: async ({ roleDiscordId }: RankDocument) => {
        const role = await Role.findOne({ discordId: roleDiscordId });
        return role;
      },
    },
    botInstance: {
      type: ReferralRanksType,
      resolve: async ({ guildDiscordId }: RankDocument) => {
        const botInstance = await BotInstance.findOne({
          guildDiscordId,
          botType: BOT_TYPES.REFERRAL_RANKS,
        });
        return botInstance;
      },
    },
    guild: {
      type: GuildType,
      resolve: async ({ guildDiscordId }: RankDocument) => {
        const guild = await Guild.findOne({ discordId: guildDiscordId });
        return guild;
      },
    },
  }),
});
