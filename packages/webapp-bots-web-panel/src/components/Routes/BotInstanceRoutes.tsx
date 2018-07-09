import React from 'react';
import { graphql, QueryRenderer } from 'react-relay';
import { RouteComponentProps } from 'react-router';
import { Loader } from 'semantic-ui-react';
import { BotInstanceRoutesQueryResponse } from '~/__generated__/BotInstanceRoutesQuery.graphql';
import { AssertionError } from '~/errors';
import relayEnvironment from '~/relayEnvironment';

import BotInstanceTypesRoutes from './BotInstanceTypesRoutes';

type RouteParams = {
  botInstanceId: string;
};

const query = graphql`
  query BotInstanceRoutesQuery($botInstanceId: ID!) {
    botInstance(id: $botInstanceId) {
      ... on ReferralRanks {
        id
        botType
      }
    }
  }
`;

const BotInstanceRoutesView = (props: BotInstanceRoutesQueryResponse) => {
  const { botInstance } = props;
  if (!botInstance || !botInstance.botType) {
    throw new AssertionError();
  }

  const BotInstanceTypeRoutes = BotInstanceTypesRoutes[botInstance.botType];
  if (!BotInstanceTypeRoutes) {
    throw new AssertionError();
  }

  return <BotInstanceTypeRoutes />;
};

const BotInstanceRoutes = (props: RouteComponentProps<RouteParams>) => (
  <QueryRenderer
    query={query}
    variables={{
      botInstanceId: props.match.params.botInstanceId,
    }}
    environment={relayEnvironment}
    render={({
      error,
      props: renderProps,
    }: {
      error: Error;
      props: BotInstanceRoutesQueryResponse;
    }) => {
      if (error) {
        throw error;
      }
      if (!renderProps) {
        return <Loader active />;
      }

      const { botInstance } = renderProps;
      if (!botInstance) {
        throw new Error('Resource not found');
      }

      return <BotInstanceRoutesView botInstance={botInstance} />;
    }}
  />
);

export default BotInstanceRoutes;
