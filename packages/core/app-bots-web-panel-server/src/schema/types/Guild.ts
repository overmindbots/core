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
import { nodeInterface } from '~/schema/interfaces/nodeDefinitions';
import { BotInstance, GuildDocument, Role } from '@overmindbots/shared-models';

import BotInstanceType from './BotInstance';
import RoleType from './Role';

const { connectionType: BotInstanceConnection } = connectionDefinitions({
  nodeType: BotInstanceType as any,
});
const { connectionType: RoleConnection } = connectionDefinitions({
  nodeType: RoleType,
});

export default new GraphQLObjectType({
  name: 'Guild',
  description: 'A guild to which a user belongs',
  interfaces: [nodeInterface],
  fields: () => ({
    id: globalIdField('Guild', source => {
      return source.discordId;
    }),
    discordId: {
      type: new GraphQLNonNull(GraphQLString),
      description: 'Id provided by Discord',
    },
    owner: {
      type: GraphQLBoolean,
      description: 'Wether the user is the owner of the guild or not',
    },
    icon: {
      type: GraphQLString,
      description: 'Icon of the guild',
    },
    name: {
      type: GraphQLString,
      description: 'Name of the guild',
    },
    roles: {
      type: RoleConnection,
      args: connectionArgs,
      description: 'Roles associated to this guild',
      resolve: async ({ discordId }: GuildDocument, args) => {
        const roles = await Role.find({
          guildDiscordId: discordId,
          name: {
            $ne: '@everyone',
          },
        })
          .sort({
            position: -1,
          })
          .exec();
        return connectionFromArray(roles, args);
      },
    },
    botInstances: {
      type: BotInstanceConnection,
      args: connectionArgs,
      resolve: async ({ discordId }, args) => {
        const botInstances = await BotInstance.find({
          guildDiscordId: discordId,
        });

        return connectionFromArray(botInstances, args);
      },
    },
  }),
});
