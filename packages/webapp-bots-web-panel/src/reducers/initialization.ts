import { Actions, ActionTypes } from '~/actions/initialization';
// import { Reducer } from 'redux';

export type State = {
  readonly authenticating: boolean;
};

const defaultState: State = {
  authenticating: true,
};

export default function actionReducer(
  state: State = defaultState,
  action: Actions
): State {
  switch (action.type) {
    case ActionTypes.SET_AUTHENTICATING: {
      return {
        ...state,
        authenticating: action.payload,
      };
    }
    default: {
      return state;
    }
  }
}
