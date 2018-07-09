import React from 'react';
import ReactDOM from 'react-dom';
import App from '~/App';
import 'src/index.css';
import registerServiceWorker from '~/registerServiceWorker';
import startup from '~/startup';

function render() {
  const element = document && document.getElementById('root');
  if (element) {
    ReactDOM.render(<App />, element);
  }
}

startup()
  .then(() => {
    render();
  })
  .catch(err => {
    throw err;
  });

registerServiceWorker();
