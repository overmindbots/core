import { AssertionError } from 'assert';
import React from 'react';
import { graphql, QueryRenderer } from 'react-relay';
import { withRouter, Route, RouteComponentProps, Switch } from 'react-router';
import { Loader } from 'semantic-ui-react';
import { ReferralRanksRoutesQueryResponse } from '~/__generated__/ReferralRanksRoutesQuery.graphql';
import ReferralRanksRanksPage, {
  RelayProps as ReferralRanksRanksRelayProps,
} from '~/components/pages/BotInstance/types/ReferralRanks/ReferralRanksRanks';
import ReferralRanksSettingsPage, {
  RelayProps as ReferralRanksSettingsRelayProps,
} from '~/components/pages/BotInstance/types/ReferralRanks/ReferralRanksSettings';
import ReferralRanksShowPage, {
  RelayProps as ReferralRanksShowRelayProps,
} from '~/components/pages/BotInstance/types/ReferralRanks/ReferralRanksShow';
import relayEnvironment from '~/relayEnvironment';

type RouteParams = {
  botInstanceId: string;
};
type RelayProps = {
  botInstance: ReferralRanksRoutesQueryResponse['botInstance'];
} & ReferralRanksShowRelayProps &
  ReferralRanksSettingsRelayProps &
  ReferralRanksRanksRelayProps;
type ViewProps = {
  match: RouteComponentProps<RouteParams>['match'];
} & RelayProps;

const query = graphql`
  query ReferralRanksRoutesQuery($botInstanceId: ID!) {
    botInstance(id: $botInstanceId) {
      ... on ReferralRanks {
        id
        ...ReferralRanksShow_botInstance
        ...ReferralRanksSettings_botInstance
        ...ReferralRanksRanks_botInstance
      }
    }
  }
`;

const ReferralRanksRoutesView = ({ botInstance, match }: ViewProps) => {
  if (!botInstance) {
    throw new AssertionError();
  }

  return (
    <Switch>
      <Route
        path={`${match.path}`}
        exact
        component={() => <ReferralRanksShowPage botInstance={botInstance} />}
      />
      <Route
        path={`${match.path}/settings`}
        exact
        component={() => (
          <ReferralRanksSettingsPage botInstance={botInstance} />
        )}
      />
      <Route
        path={`${match.path}/ranks`}
        exact
        component={() => <ReferralRanksRanksPage botInstance={botInstance} />}
      />
      <Route component={() => <p>Not found</p>} />
    </Switch>
  );
};

const ReferralRanksRoutes = (props: RouteComponentProps<RouteParams>) => (
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
      props: RelayProps;
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

      return (
        <ReferralRanksRoutesView
          botInstance={botInstance}
          match={props.match}
        />
      );
    }}
  />
);

export default withRouter(ReferralRanksRoutes);
