import { SessionDocument } from '@overmindbots/shared-models';
import { mutationWithClientMutationId } from 'graphql-relay';
import { requireSession } from '~/utils/graphQL';

export default mutationWithClientMutationId({
  name: 'Logout',
  inputFields: {},
  outputFields: {},
  mutateAndGetPayload: async (object, context) => {
    const session = (await requireSession(context)) as SessionDocument;
    const result = await session.remove();
    return result;
  },
});
