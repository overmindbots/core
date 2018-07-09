/* tslint:disable ordered-imports */
import { fromGlobalId } from 'graphql-relay';
import { map, filter, includes } from 'lodash';
import { AssertionError } from '~/shared/errors';
import {
  BotInstance,
  Guild,
  SessionDocument,
  User,
  UserDocument,
} from '@overmindbots/shared-models';
import { GraphQLID, GraphQLObjectType, GraphQLSchema } from 'graphql';
import { requireSession } from '~/utils/graphQL';

import adminSendBroadcastMutation from './mutations/adminSendBroadcast';
import referralRanksUpdateMutation from './mutations/botInstances/referralRanks/update';
import referralRanksSetRankMutation from './mutations/botInstances/referralRanks/setRank';
import logoutMutation from './mutations/logout';
import GuildType from './types/Guild';
import BotInstanceType from './types/BotInstance';
import SessionType from './types/Session';
import UserType from './types/User';
import { nodeField } from './interfaces/nodeDefinitions';
import DiscordClient from '../utils/discord';
import { Permissions } from 'discord.js';
import { GraphQLNotFoundError } from '~/shared/graphqlErrors';

export default new GraphQLSchema({
  query: new GraphQLObjectType({
    name: 'Query',
    fields: () => {
      return {
        node: nodeField,
        currentUser: {
          type: UserType,
          resolve: async (source, args, context) => {
            const session = (await requireSession(context)) as SessionDocument;
            const user = await User.findOne(session.user);
            return user;
          },
        },
        session: {
          type: SessionType,
          resolve: async (source, args, context) => {
            const session = await requireSession(context);
            return session;
          },
        },
        guild: {
          type: GuildType,
          args: {
            id: { type: GraphQLID },
          },
          resolve: async (source, { id: globalId }, context) => {
            const { id } = fromGlobalId(globalId);
            const session = (await requireSession(context)) as SessionDocument;
            const user = (await User.findOne(session.user)) as UserDocument;
            const accessToken = await user.getDiscordOauthToken();

            if (!user) {
              throw new AssertionError();
            }

            const client = new DiscordClient({ accessToken });
            const accessibleGuildIds = map(
              await client.guilds(true, user),
              ({ discordId }) => discordId
            );

            const guild = await Guild.findOne({
              discordId: `${id}`,
            });

            if (!guild) {
              throw new GraphQLNotFoundError();
            }

            if (!includes(accessibleGuildIds, guild.discordId)) {
              throw new Error(
                'Attempted to access guild that is not managed by user'
              );
            }

            return guild;
          },
        },
        botInstance: {
          type: BotInstanceType,
          args: {
            id: { type: GraphQLID },
          },
          resolve: async (source, { id: globalId }, context) => {
            const { id: botInstanceId } = fromGlobalId(globalId);
            const session = (await requireSession(context)) as SessionDocument;
            const user = await User.findOne(session.user);

            if (!user) {
              throw new GraphQLNotFoundError();
            }

            const botInstance = await BotInstance.findOne({
              _id: botInstanceId,
            });

            if (!botInstance) {
              throw new GraphQLNotFoundError();
            }

            const { guildDiscordId } = botInstance;
            const accessToken = await user.getDiscordOauthToken();

            const client = new DiscordClient({ accessToken });

            const discordGuilds = await client.guilds(true, user);
            const accessibleGuildsIds = map(
              filter(discordGuilds, ({ permissions }) => {
                const resolvedPermissions = new Permissions(permissions);
                return resolvedPermissions.has('MANAGE_GUILD');
              }),
              ({ discordId }) => discordId
            );

            if (!includes(accessibleGuildsIds, guildDiscordId)) {
              throw new Error(
                'Attempted to access guild that is not managed by user'
              );
            }

            const guild = await Guild.findOne({
              discordId: guildDiscordId,
            });

            if (!guild) {
              throw new GraphQLNotFoundError();
            }

            return botInstance;
          },
        },
      };
    },
  }),

  mutation: new GraphQLObjectType({
    name: 'Mutation',
    fields: () => ({
      logout: logoutMutation,
      referralRanksUpdate: referralRanksUpdateMutation,
      adminSendBroadcast: adminSendBroadcastMutation,
      referralRanksSetRank: referralRanksSetRankMutation,
    }),
  }),
});
