import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import { Container, List } from 'semantic-ui-react';

export default class AdminPage extends Component {
  render() {
    return (
      <Container>
        <h1>Admin</h1>
        <List>
          <List.Item as={Link} to="/admin/broadcast">
            Broadcast
          </List.Item>
        </List>
      </Container>
    );
  }
}
