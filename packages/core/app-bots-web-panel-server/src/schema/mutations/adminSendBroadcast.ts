import { GraphQLNonNull, GraphQLString } from 'graphql';
import { mutationWithClientMutationId } from 'graphql-relay';
import { includes, values } from 'lodash';
import bots from '~/bots';
import { BOT_TYPES } from '~/shared/constants';
import {
  GraphQLBadRequestError,
  GraphQLUnauthorizedError,
} from '~/shared/graphqlErrors';
import { SessionDocument, User } from '~/shared/models';
import { requireSession } from '~/utils/graphQL';

interface MutationInput {
  botType: BOT_TYPES;
  message: string;
}

export default mutationWithClientMutationId({
  name: 'AdminSendBroadcast',
  inputFields: () => ({
    botType: {
      type: new GraphQLNonNull(GraphQLString),
    },
    message: {
      type: new GraphQLNonNull(GraphQLString),
    },
  }),
  mutateAndGetPayload: async ({ botType, message }: MutationInput, context) => {
    const session = (await requireSession(context)) as SessionDocument;
    const user = await User.findOne(session.user);
    if (!user || !user.isAdmin) {
      throw new GraphQLUnauthorizedError();
    }

    if (!includes(values(BOT_TYPES), botType)) {
      throw new GraphQLBadRequestError(`Bot type "${botType}" doesn't exist`);
    }

    bots[botType].broadcast(message);
    return {};
  },
  outputFields: {},
});