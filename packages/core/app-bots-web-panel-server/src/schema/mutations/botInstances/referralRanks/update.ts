import {
  BotInstance,
  Guild,
  SessionDocument,
  User,
} from '@overmindbots/shared-models';
import {
  PREFIX_PATTERN,
  ReferralRanksBotConfig,
} from '@overmindbots/shared-utils/constants';
import { AssertionError } from '@overmindbots/shared-utils/errors';
import {
  GraphQLNotFoundError,
  GraphQLUnauthorizedError,
} from '@overmindbots/shared-utils/graphqlErrors';
import { GraphQLID, GraphQLNonNull } from 'graphql';
import { fromGlobalId, mutationWithClientMutationId } from 'graphql-relay';
import GraphQLJSON from 'graphql-type-json';
import ReferralRanksType from '~/schema/types/BotInstance/ReferralRanks';
import { requireSession } from '~/utils/graphQL';

interface ReferralRanksBotInstance {
  id: string;
  config: ReferralRanksBotConfig;
}

// TODO: GraphQL-specific Errors should not be in shared package
// TODO: Find way to avoid duplicating type definitions here
// FIXME: Support mutiple bot types when the time comes
function validate(data: ReferralRanksBotInstance) {
  const {
    config: { prefix },
  } = data;

  // Validate prefix
  if (!prefix) {
    return 'Prefix is not set';
  }
  if (prefix.length !== 1) {
    return 'Prefix is not 1 char long';
  }
  if (!PREFIX_PATTERN.test(prefix)) {
    return 'Prefix pattern test failed';
  }

  return undefined;
}

export default mutationWithClientMutationId({
  name: 'ReferralRanksUpdate',
  inputFields: {
    id: {
      type: new GraphQLNonNull(GraphQLID),
      description: 'Id of the botInstance to update',
    },
    config: {
      type: GraphQLJSON,
      description: "Fields to update in the BotInstance's config object",
    },
  },
  outputFields: {
    botInstance: {
      type: ReferralRanksType,
      resolve: async ({ id }: { id: string }) => {
        const botInstance = await BotInstance.findOne({ _id: id });
        return botInstance;
      },
    },
  },
  mutateAndGetPayload: async (data, context) => {
    const { id: globalId } = data;
    const { id } = fromGlobalId(globalId);
    const session = (await requireSession(context)) as SessionDocument;
    const user = await User.findOne(session.user);

    if (!user) {
      await session.remove();
      throw new AssertionError();
    }
    const botInstance = await BotInstance.findById(id);
    if (!botInstance) {
      throw new GraphQLNotFoundError();
    }
    const guild = Guild.findOne({ discordId: botInstance.guildDiscordId });
    if (!guild) {
      throw new GraphQLUnauthorizedError(
        'The guild with id ${guildId} does not belong to user associated with' +
          " the request's session"
      );
    }

    const currentData = botInstance.toObject();
    const fullData = { ...currentData, ...data };

    const error = validate(fullData);
    if (error) {
      throw new Error(error);
    }

    await botInstance.update(fullData);

    return {
      id,
    };
  },
});
