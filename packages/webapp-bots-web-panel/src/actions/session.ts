import { ActionsUnion } from '~/types/actions';
import { User as UserModel } from '~/types/models';
import { createAction } from '~/utils/actions';

export enum ActionTypes {
  SET_TOKEN = 'SESSION_SET_TOKEN',
  SET_USER = 'SESSION_SET_USER',
  LOGOUT = 'LOGOUT',
}

export const actions = {
  setToken: ({ token }: { token: string }) =>
    createAction(ActionTypes.SET_TOKEN, token),
  setUser: ({ user }: { user: UserModel }) =>
    createAction(ActionTypes.SET_USER, user),
  logout: () => createAction(ActionTypes.LOGOUT),
};

export type Actions = ActionsUnion<typeof actions>;
