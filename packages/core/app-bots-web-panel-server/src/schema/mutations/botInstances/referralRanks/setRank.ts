import {
  Guild,
  Role,
  SessionDocument,
  User,
} from '@overmindbots/shared-models';
import { Rank } from '@overmindbots/shared-models/referralRanks';
import { RankDocument } from '@overmindbots/shared-models/referralRanks/Rank';
import {
  GraphQLBadRequestError,
  GraphQLNotFoundError,
} from '@overmindbots/shared-utils/graphqlErrors';
import { AssertionError } from 'assert';
import {
  GraphQLInt,
  GraphQLID,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from 'graphql';
import { mutationWithClientMutationId, toGlobalId } from 'graphql-relay';
import RankType from '~/schema/types/ReferralRanksRank';
import { requireSession } from '~/utils/graphQL';

export default mutationWithClientMutationId({
  name: 'ReferralRanksSetRank',
  inputFields: () => ({
    roleDiscordId: {
      type: new GraphQLNonNull(GraphQLString),
      description: 'Discord id of the Role',
    },
    invitesRequired: {
      type: new GraphQLNonNull(GraphQLInt),
      description: 'Invites required for the Role to be assigned',
    },
  }),
  outputFields: {
    deletedRankId: {
      type: GraphQLID,
      resolve: async ({ deletedRankId }: { deletedRankId: string }) => {
        if (!deletedRankId) {
          return null;
        }
        return toGlobalId('ReferralRanksRank', deletedRankId);
      },
    },
    newRank: {
      type: new GraphQLObjectType({
        name: 'ReferralRanksSetRankNewRank',
        fields: () => ({
          node: {
            type: RankType,
          },
        }),
      }),
      resolve: ({ newRank }: { newRank: RankDocument }) => {
        return { node: newRank };
      },
    },
    rank: {
      type: RankType,
      resolve: async ({
        roleDiscordId,
        guildDiscordId,
      }: {
        roleDiscordId: string;
        guildDiscordId: string;
      }) => {
        const rank = await Rank.findOne({
          roleDiscordId,
          guildDiscordId,
        });
        return rank;
      },
    },
  },
  mutateAndGetPayload: async (data, context) => {
    const { roleDiscordId, invitesRequired } = data;

    const session = (await requireSession(context)) as SessionDocument;
    const user = await User.findOne(session.user);

    if (!user) {
      await session.remove();
      throw new AssertionError();
    }

    const role = await Role.findOne({ discordId: roleDiscordId });
    if (!role) {
      throw new GraphQLNotFoundError('role not found');
    }
    if (role.name === '@everyone') {
      throw new GraphQLBadRequestError();
    }
    const guild = await Guild.findOne({
      userDiscordId: user.discordId,
      discordId: role.guildDiscordId,
    });

    if (!guild) {
      throw new GraphQLNotFoundError('guild not found');
    }

    const { discordId: guildDiscordId } = guild;

    // Delete if invitesRequired are negative
    if (invitesRequired < 0) {
      const rankToDelete = await Rank.findOne({
        guildDiscordId,
        roleDiscordId,
      });
      if (!rankToDelete) {
        return {};
      }
      rankToDelete.remove();

      return {
        deletedRankId: rankToDelete.id,
      };
    }

    let newRank;
    let rank;
    const originalRank = await Rank.findOneAndUpdate(
      { roleDiscordId, guildDiscordId },
      {
        invitesRequired,
        roleDiscordId,
      },
      { upsert: true }
    );

    const rankData = (newRank = await Rank.findOne({
      roleDiscordId,
      guildDiscordId,
    }));

    if (!originalRank) {
      newRank = rankData;
    } else {
      rank = rankData;
    }

    return { roleDiscordId, newRank, rank };
  },
});
