import { commitMutation } from 'react-relay';
import { MutationConfig } from 'relay-runtime';
import environment from '~/relayEnvironment';
import uuid from 'uuid/v4';

const noop = (...args: any[]) => {
  /* noop */
};

export default function mutate(config: MutationConfig<any>): Promise<any> {
  return new Promise((resolve, reject) => {
    config.variables.input = {
      clientMutationId: uuid(),
      ...config.variables.input,
    };
    const { onCompleted = noop, onError = noop } = config;

    config.onCompleted = (response, errors) => {
      onCompleted(response, errors);
      resolve({ response, errors });
    };
    config.onError = error => {
      onError(error);
      reject(error);
    };

    commitMutation(environment, config);
  });
}
