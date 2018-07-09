import { routerReducer } from 'react-router-redux';
import { combineReducers, Reducer } from 'redux';
import { reducer as formReducer } from 'redux-form';

import initialization, { State as InitializationState } from './initialization';
import session, { State as SessionState } from './session';

export type RootState = {
  session: SessionState;
  initialization: InitializationState;
  routerReducer: typeof routerReducer;
  form: typeof formReducer;
};

const rootReducer = combineReducers<RootState>({
  form: formReducer,
  routerReducer,
  session,
  // FIXME: This shouldn't be required, something is wrong with typing
  initialization: initialization as Reducer<InitializationState>,
});

export default rootReducer;
