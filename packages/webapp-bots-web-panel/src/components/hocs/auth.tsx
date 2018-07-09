import React from 'react';
import connectedAuthWrapper from 'redux-auth-wrapper/connectedAuthWrapper';
import { connectedRouterRedirect } from 'redux-auth-wrapper/history4/redirect';
import { Loader } from 'semantic-ui-react';
import { RootState } from '~/reducers';

const LoaderComponent = () => <Loader active />;

const userIsAuthenticatedDefaults = {
  authenticatedSelector: (state: RootState) => !!state.session.user,
  authenticatingSelector: (state: RootState) =>
    state.initialization.authenticating,
  wrapperDisplayName: 'UserIsAuthenticated',
};
export const userIsAuthenticated = connectedAuthWrapper(
  userIsAuthenticatedDefaults
);
export const userIsAuthenticatedRedir = connectedRouterRedirect({
  ...userIsAuthenticatedDefaults,
  AuthenticatingComponent: LoaderComponent,
  redirectPath: '/login',
});

const userIsNotAuthenticatedDefaults = {
  authenticatedSelector: (state: RootState) =>
    state.session.user === null &&
    state.initialization.authenticating === false,
  authenticatingSelector: (state: RootState) =>
    state.initialization.authenticating,
  wrapperDisplayName: 'UserIsNotAuthenticated',
};
export const userIsNotAuthenticated = connectedAuthWrapper(
  userIsNotAuthenticatedDefaults
);
export const userIsNotAuthenticatedRedir = connectedRouterRedirect({
  ...userIsNotAuthenticatedDefaults,
  redirectPath: '/',
  allowRedirectBack: false,
});

const userIsAdminDefaults = {
  authenticatedSelector: (state: RootState) =>
    !!state.session.user && !!state.session.user.isAdmin,
  authenticatingSelector: (state: RootState) =>
    state.initialization.authenticating,
  wrapperDisplayName: 'UserIsAdmin',
};
export const userIsAdmin = connectedAuthWrapper(userIsAdminDefaults);
export const userIsAdminRedir = connectedRouterRedirect({
  ...userIsAdminDefaults,
  redirectPath: '/',
  allowRedirectBack: false,
});
