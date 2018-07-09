import { ActionsUnion } from '~/types/actions';
import { createAction } from '~/utils/actions';

export enum ActionTypes {
  SET_AUTHENTICATING = 'SET_AUTHENTICATING',
}

export const actions = {
  setAuthenticating: (authenticating: boolean) =>
    createAction(ActionTypes.SET_AUTHENTICATING, authenticating),
};

export type Actions = ActionsUnion<typeof actions>;
