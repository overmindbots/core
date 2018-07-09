import React, { Component } from 'react';
import { Provider } from 'react-redux';
import { Router } from 'react-router';
import { PersistGate } from 'redux-persist/integration/react';
import InitializerGate from '~/components/gates/InitializerGate';
import Routes from '~/components/Routes';
import history from '~/history';
import persistor from '~/persistor';
import store from '~/store';

export default class App extends Component {
  render() {
    return (
      <Provider store={store}>
        <PersistGate loading={null} persistor={persistor}>
          <InitializerGate>
            <Router history={history}>
              <Routes />
            </Router>
          </InitializerGate>
        </PersistGate>
      </Provider>
    );
  }
}
