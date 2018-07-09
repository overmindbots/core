import { graphql } from 'react-relay';
import mutate from '~/utils/mutate';

interface Input {
  id: string;
  config: {
    [key: string]: any;
  };
}

const mutation = graphql`
  mutation ReferralRanksUpdateMutation($input: ReferralRanksUpdateInput!) {
    referralRanksUpdate(input: $input) {
      clientMutationId
      botInstance {
        config {
          prefix
        }
      }
    }
  }
`;

export default async function referralRanksUpdate({ id, config }: Input) {
  const res = await mutate({
    mutation,
    variables: {
      input: { id, config },
    },
  });
  return res;
}
