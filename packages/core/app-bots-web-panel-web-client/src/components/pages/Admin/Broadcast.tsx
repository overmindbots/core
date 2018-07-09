import React, { Component } from 'react';

import BroadcastForm from './BroadcastForm';

export default class AdminPage extends Component {
  render() {
    return (
      <div>
        <h1>Broadcast Utility</h1>
        <BroadcastForm />
      </div>
    );
  }
}
