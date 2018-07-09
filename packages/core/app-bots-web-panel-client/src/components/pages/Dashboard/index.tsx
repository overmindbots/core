import React from 'react';
import { Breadcrumb, Container, Divider } from 'semantic-ui-react';
import GuildList from '~/components/GuildList';

const Dashboard = () => (
  <Container>
    <Breadcrumb size="huge">
      <Breadcrumb.Section active>Dashboard</Breadcrumb.Section>
    </Breadcrumb>
    <Divider />
    <Container textAlign="center">
      <h1>Your servers</h1>
      <GuildList />
    </Container>
  </Container>
);

export default Dashboard;
