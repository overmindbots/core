import queryString from 'query-string';
import React, { Component, Fragment } from 'react';
import { connect, Dispatch } from 'react-redux';
import { graphql, QueryRenderer } from 'react-relay';
import { Loader } from 'semantic-ui-react';
import { actions as initializationActions } from '~/actions/initialization';
import { actions as sessionActions } from '~/actions/session';
import { RootState } from '~/reducers';
import environment from '~/relayEnvironment';
import { User as UserModel } from '~/types/models';

interface InitializerGateRendererP {
  session?: {
    user: UserModel;
  };
  dispatch: Dispatch<any>;
  token: string | null;
}
interface InitializerGateP {
  token: string | null;
  dispatch: Dispatch<any>;
}

/**
 * Ensures that children will only render after session data is up to date
 */
class InitializerGateRenderer extends Component<InitializerGateRendererP> {
  state = {};
  static getDerivedStateFromProps({
    session,
    dispatch,
    token,
  }: InitializerGateRendererP) {
    if (!session && token) {
      dispatch(sessionActions.logout());
    }
    if (session) {
      dispatch(sessionActions.setUser({ user: session.user }));
    }

    dispatch(initializationActions.setAuthenticating(false));

    return null;
  }

  render() {
    return <Fragment>{this.props.children}</Fragment>;
  }
}

const WrappedInitializerGateRenderer = connect(null)(InitializerGateRenderer);

/**
 * Query session to server anytime session token exists
 */
class InitializerGate extends Component<InitializerGateP> {
  state = { token: null };
  static getDerivedStateFromProps({
    dispatch,
    token: stateToken,
  }: InitializerGateP) {
    const { token: urlToken } = queryString.parse(window.location.search);

    if (urlToken && urlToken !== stateToken) {
      dispatch(sessionActions.setToken({ token: urlToken }));
    }

    const token = urlToken || stateToken;

    return { token };
  }

  render() {
    const { token } = this.state;

    if (!token) {
      return (
        <WrappedInitializerGateRenderer token={null}>
          {this.props.children}
        </WrappedInitializerGateRenderer>
      );
    }

    return (
      <QueryRenderer
        variables={{
          token,
        }}
        environment={environment}
        query={graphql`
          query InitializerGateQuery {
            session {
              user {
                id
                displayName
                discordAccessToken
                isAdmin
                avatar
                discordId
              }
            }
          }
        `}
        render={response => {
          if (!response.props) {
            return <Loader active />;
          }
          return (
            <WrappedInitializerGateRenderer token={token} {...response.props}>
              {this.props.children}
            </WrappedInitializerGateRenderer>
          );
        }}
      />
    );
  }
}

const mapStateToProps = ({ session: { token } }: RootState) => ({ token });

export default connect(mapStateToProps)(InitializerGate);
