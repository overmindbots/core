import * as localForage from 'localforage';
import { routerMiddleware } from 'react-router-redux';
import {
  applyMiddleware,
  compose,
  createStore,
  AnyAction,
  StoreEnhancer,
} from 'redux';
import { createLogger } from 'redux-logger';
import { persistReducer, BaseReducer } from 'redux-persist';
import thunk from 'redux-thunk';
import history from '~/history';
import rootReducer, { RootState } from '~/reducers';

const persistConfig = {
  key: 'primary',
  storage: localForage,
  debug: true,
  whitelist: ['session'],
};

// Hacky fix for bad typing
const reducer = persistReducer(persistConfig, rootReducer as BaseReducer<
  RootState,
  AnyAction
  >);

const middleware = [];
const enhancers = [];
const router = routerMiddleware(history);

middleware.push(thunk);
middleware.push(router);

if (process.env.NODE_ENV === 'development') {
  const logger = createLogger({ level: 'info', collapsed: true });
  middleware.push(logger);
}

enhancers.push(applyMiddleware(...middleware));

const enhancer = compose(...enhancers) as StoreEnhancer<any>;
const store = createStore(
  reducer,
  window.__REDUX_DEVTOOLS_EXTENSION__ && window.__REDUX_DEVTOOLS_EXTENSION__(),
  enhancer
);

export default store;
