import React from 'react';
import { Route, RouteComponentProps, Switch } from 'react-router';
import AdminPage from '~/components/pages/Admin';
import AdminBroadcastPage from '~/components/pages/Admin/Broadcast';

const AdminRoutes = (props: RouteComponentProps<any>) => (
  <Switch>
    <Route path={`${props.match.path}`} component={AdminPage} exact />
    <Route
      path={`${props.match.path}/broadcast`}
      component={AdminBroadcastPage}
    />
  </Switch>
);

export default AdminRoutes;
