/// <reference types="node" />
declare module 'passport-discord-oauth2' {
  type StrategyCallback = (
    accessToken: string,
    refreshToken: string,
    profile: object,
    callback: (error?: object | null, user?: object) => void
  ) => Promise<any>;
  export class Strategy {
    readonly authorizationURL: string;
    authenticate(): void;
    constructor(
      options: {
        clientID: string;
        clientSecret: string;
        callbackURL: string;
        scope: string;
      },
      callback: StrategyCallback
    );
  }
}
