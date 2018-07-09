import { graphql } from 'react-relay';
import { actions as sessionActions } from '~/actions/session';
import store from '~/store';
import mutate from '~/utils/mutate';

const mutation = graphql`
  mutation LogoutMutation($input: LogoutInput!) {
    logout(input: $input) {
      clientMutationId
    }
  }
`;

export default async function logout() {
  const res = await mutate({
    mutation,
    variables: {
      input: {},
    },
    onCompleted: (response, errors) => {
      store.dispatch(sessionActions.logout());
    },
    onError: err => {
      // tslint:disable-next-line
      console.error('Error submiting', err);
    },
  });
  return res;
}
