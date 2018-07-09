import { Environment, Network, RecordSource, Store } from 'relay-runtime';
import { actions } from '~/actions/session';
import { GRAPHQL_API_URL, NETWORK_ERROR_TYPES } from '~/constants';
import { State as SessionState } from '~/reducers/session';
import store from '~/store';

interface Operation {
  text: string;
}

async function fetchQuery(operation: Operation, variables: Object) {
  const { session }: { session: SessionState } = store.getState();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  // Append token session to request if available
  const token = session && session.token;
  if (token && typeof token === 'string') {
    headers.Authentication = `Bearer ${token}`;
  }

  const response = await fetch(GRAPHQL_API_URL, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      query: operation.text,
      variables,
    }),
  });

  const responseBody = await response.json();

  // If we have a session error, don't propagate it and elimiate the session
  if (responseBody.errors) {
    const [error] = responseBody.errors;
    if (error.message === NETWORK_ERROR_TYPES.UNAUTHENTICATED) {
      store.dispatch(actions.logout());
      return { data: null };
    }
  }

  return responseBody;
}

const environment = new Environment({
  network: Network.create(fetchQuery),
  store: new Store(new RecordSource()),
});

export default environment;
