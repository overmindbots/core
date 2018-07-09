import { Actions, ActionTypes } from '~/actions/session';
import { User as UserModel } from '~/types/models';

export type State = {
  readonly token: string | null;
  readonly user: UserModel | null;
};

const defaultState: State = {
  token: null,
  user: null,
};

export default function sessionReducer(
  state: State = defaultState,
  action: Actions
): State {
  switch (action.type) {
    case ActionTypes.SET_TOKEN: {
      return {
        ...state,
        token: action.payload,
      };
    }
    case ActionTypes.SET_USER: {
      return {
        ...state,
        user: action.payload,
      };
    }
    case ActionTypes.LOGOUT: {
      return {
        ...state,
        user: null,
        token: null,
      };
    }
    default: {
      return state;
    }
  }
}
