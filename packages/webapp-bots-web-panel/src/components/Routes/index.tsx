import React from 'react';
import { Redirect, Route, Switch } from 'react-router-dom';
import {
  userIsAdminRedir,
  userIsAuthenticatedRedir,
  userIsNotAuthenticatedRedir,
} from '~/components/hocs/auth';
import MainLayout from '~/components/layouts/Main';
import DashboardPage from '~/components/pages/Dashboard';
import DiscordLoginCallbackPage from '~/components/pages/DiscordLoginCallback';
import GuildsShowPage from '~/components/pages/GuildsShow';
import LoginPage from '~/components/pages/Login';

import AdminRoutes from './AdminRoutes';
import BotInstanceRoutes from './BotInstanceRoutes';

const Routes = () => (
  <MainLayout>
    <Switch>
      <Route
        path="/"
        component={userIsAuthenticatedRedir(() => <DashboardPage />)}
        exact
      />
      <Route
        path="/guilds/:guildId"
        component={userIsAuthenticatedRedir(() => <GuildsShowPage />)}
      />
      <Route
        path="/botInstances/:botInstanceId"
        component={userIsAuthenticatedRedir(props => (
          <BotInstanceRoutes {...props as any} />
        ))}
      />
      <Route
        path="/admin"
        component={userIsAdminRedir(props => <AdminRoutes {...props as any} />)}
      />
      <Route
        path="/login"
        component={userIsNotAuthenticatedRedir(() => <LoginPage />)}
        exact
      />
      <Route
        path="/oauth/discord/callback"
        component={DiscordLoginCallbackPage}
        exact
      />
      <Route path="/page-not-found" component={() => <h1>404</h1>} />
      <Redirect push to="/page-not-found" />
    </Switch>
  </MainLayout>
);

export default Routes;
