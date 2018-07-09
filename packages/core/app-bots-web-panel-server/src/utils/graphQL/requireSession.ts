import {
  GraphQLBadRequestError,
  GraphQLUnauthenticatedError,
} from '~/shared/graphqlErrors';
import { Session } from '@overmindbots/shared-models';

/* IMPROVE: `requireSession` should be able to define its return value
  as `SessionDocument` (non-null) if `throwIfUnauthenticated` is true.
  Right now code using this function are having to cast the type
  on their own.
*/

interface Opts {
  throwIfUnauthenticated?: boolean;
}
interface Context {
  [propName: string]: any;
  headers: {
    authentication?: string;
  };
}

export default async function requireSession(
  context: Context,
  { throwIfUnauthenticated = true }: Opts = {}
) {
  const { authentication } = context.headers;
  let token = null;

  /* Parse and validate Bearer token if present */
  if (!(typeof authentication === 'string')) {
    if (throwIfUnauthenticated) {
      throw new GraphQLUnauthenticatedError();
    }
  } else {
    const bearerToken = authentication.split('Bearer ')[1];
    if (!bearerToken) {
      throw new GraphQLBadRequestError();
    }
    token = bearerToken;
  }

  /* Validate session against database */
  const session = await Session.findOne({ token });
  if (session === null && throwIfUnauthenticated) {
    if (throwIfUnauthenticated) {
      throw new GraphQLUnauthenticatedError();
    }
  }

  return session;
}
