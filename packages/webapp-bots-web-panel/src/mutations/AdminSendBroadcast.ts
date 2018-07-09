import { graphql } from 'react-relay';
import mutate from '~/utils/mutate';

interface Input {
  botType: string;
  message: string;
}

const mutation = graphql`
  mutation AdminSendBroadcastMutation($input: AdminSendBroadcastInput!) {
    adminSendBroadcast(input: $input) {
      clientMutationId
    }
  }
`;

export default function adminSendBroadcast({ botType, message }: Input) {
  mutate({
    mutation,
    variables: {
      input: { botType, message },
    },
    onError: err => {
      // tslint:disable-next-line
      console.error(err)
    },
  });
}
