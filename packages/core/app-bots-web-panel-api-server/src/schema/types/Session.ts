import { GraphQLNonNull, GraphQLObjectType } from 'graphql';
import { globalIdField } from 'graphql-relay';
import { nodeInterface } from '~/schema/interfaces/nodeDefinitions';
import { User } from '~/shared/models';

import UserType from './User';

export default new GraphQLObjectType({
  name: 'Session',
  description: "A user's session",
  interfaces: [nodeInterface],
  fields: () => ({
    id: globalIdField('Session'),
    user: {
      type: new GraphQLNonNull(UserType),
      description: 'Session data',
      resolve: session => User.findOne(session.user),
    },
  }),
});
