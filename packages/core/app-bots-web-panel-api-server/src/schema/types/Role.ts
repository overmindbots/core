import {
  GraphQLBoolean,
  GraphQLInt,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from 'graphql';
import { globalIdField } from 'graphql-relay';
import { nodeInterface } from '~/schema/interfaces/nodeDefinitions';

export default new GraphQLObjectType({
  name: 'Role',
  interfaces: [nodeInterface],
  description: "a Guild's Role",
  fields: {
    id: globalIdField('Role'),
    discordId: {
      type: new GraphQLNonNull(GraphQLString),
    },
    name: {
      type: new GraphQLNonNull(GraphQLString),
    },
    color: {
      type: new GraphQLNonNull(GraphQLInt),
    },
    position: {
      type: new GraphQLNonNull(GraphQLInt),
    },
    permissions: {
      type: new GraphQLNonNull(GraphQLInt),
    },
    managed: {
      type: new GraphQLNonNull(GraphQLBoolean),
    },
    mentionable: {
      type: new GraphQLNonNull(GraphQLBoolean),
    },
  },
});
