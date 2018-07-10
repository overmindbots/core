import { GraphQLBoolean, GraphQLObjectType, GraphQLString } from 'graphql';
import {
  connectionArgs,
  connectionDefinitions,
  connectionFromArray,
  globalIdField,
} from 'graphql-relay';

import { User } from '@overmindbots/shared-models';
import {
  AssertionError,
  UnexpectedError,
} from '@overmindbots/shared-utils/errors';
import { nodeInterface } from '~/schema/interfaces/nodeDefinitions';
import DiscordClient from '~/utils/discord';

import GuildType from './Guild';

const { connectionType: GuildConnection } = connectionDefinitions({
  nodeType: GuildType,
});

export default new GraphQLObjectType({
  name: 'User',
  description: 'A User',
  interfaces: () => [nodeInterface],
  fields: () => ({
    id: globalIdField('User'),
    avatar: {
      type: GraphQLString,
      description: "Hash string for the user's avatar URL",
    },
    discordId: {
      type: GraphQLString,
      description: "User's discordId",
    },
    displayName: {
      type: GraphQLString,
      description: 'A vanity name for the user',
    },
    isAdmin: {
      type: GraphQLBoolean,
      description: 'Wether the user is an admin or not',
    },
    discordAccessToken: {
      type: GraphQLString,
      description: "Access token provided by Discord's API",
      resolve: async source => {
        const user = await User.findOne(source._id);

        if (!user) {
          throw new AssertionError();
        }

        const accessToken = await user.getDiscordOauthToken();
        return accessToken;
      },
    },
    guilds: {
      type: GuildConnection,
      args: connectionArgs,
      resolve: async (source, args, context) => {
        const user = await User.findOne(source._id);
        if (!user) {
          throw new UnexpectedError();
        }

        const accessToken = await user.getDiscordOauthToken();
        const client = new DiscordClient({ accessToken });
        const result = await client.guilds(true, source);

        return connectionFromArray(result, args);
      },
    },
  }),
});
