import {
  GraphQLBoolean,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from 'graphql';
import {
  connectionArgs,
  connectionDefinitions,
  connectionFromArray,
  globalIdField,
} from 'graphql-relay';
import { filter, includes, map } from 'lodash';
import { nodeInterface } from '~/schema/interfaces/nodeDefinitions';
import GuildType from '~/schema/types/Guild';
import RankType from '~/schema/types/ReferralRanksRank';
import { BotInstanceDocument, Role } from '@overmindbots/shared-models';
import { Rank } from '@overmindbots/shared-models/referralRanks';

import { sharedResolvers } from './index';

const {
  connectionType: RankConnection,
  edgeType: RankEdge,
} = connectionDefinitions({
  nodeType: RankType,
});

export const RankEdgeType = RankEdge;

export default new GraphQLObjectType({
  name: 'ReferralRanks',
  description: 'BotInstance for the Referral Ranks bot',
  interfaces: () => [nodeInterface],
  fields: () => ({
    id: globalIdField('BotInstance'),
    botType: {
      type: new GraphQLNonNull(GraphQLString),
      description: 'Type of bot this is an instance of',
    },
    guildDiscordId: {
      type: new GraphQLNonNull(GraphQLString),
      description: 'Discord ID of the Guild this instance is part of',
    },
    name: {
      type: GraphQLString,
      description: 'Name of the bot type',
      resolve: sharedResolvers.name,
    },
    enabled: {
      type: GraphQLBoolean,
      description: 'Wether bot is active in the server or not',
    },
    config: {
      type: new GraphQLObjectType({
        name: 'ReferralRanksConfig',
        fields: {
          prefix: {
            type: new GraphQLNonNull(GraphQLString),
          },
        },
      }),
      description: 'Black-box object with config data for a botInstance',
    },
    guild: {
      type: new GraphQLNonNull(GuildType),
      resolve: sharedResolvers.guild,
    },
    maxRoleDiscordId: {
      type: GraphQLString,
      description:
        'The discordId of the Role assigned to the botInstance' +
        ' that is highest in position',
    },
    ranks: {
      type: RankConnection,
      args: connectionArgs,
      resolve: async ({ guildDiscordId }: BotInstanceDocument, args) => {
        const ranks = await Rank.find({ guildDiscordId });
        const roleIds = map(ranks, ({ roleDiscordId }) => roleDiscordId);
        const roles = await Role.find({ discordId: { $in: roleIds } });
        const actualRoleIds = map(roles, ({ discordId }) => discordId);
        const missingRoleIds = filter(
          roleIds,
          roleId => !includes(actualRoleIds, roleId)
        );
        // Delete ranks whose roles don't exist anymore
        await Rank.deleteMany({ roleDiscordId: { $in: missingRoleIds } });
        const filteredRanks = filter(
          ranks,
          ({ roleDiscordId }) => !includes(missingRoleIds, roleDiscordId)
        );
        return connectionFromArray(filteredRanks, args);
      },
    },
  }),
});
