import { User } from '@overmindbots/shared-models';
import passport from 'passport';
import { Strategy } from 'passport-oauth2';
import {
  DISCORD_CLIENT_ID,
  DISCORD_CLIENT_SECRET,
  OAUTH_AUTHORIZATION_URL,
  OAUTH_CALLBACK_URL,
  OAUTH_TOKEN_URL,
} from '~/constants';

passport.use(
  new Strategy(
    {
      clientID: DISCORD_CLIENT_ID,
      clientSecret: DISCORD_CLIENT_SECRET,
      callbackURL: OAUTH_CALLBACK_URL,
      authorizationURL: OAUTH_AUTHORIZATION_URL,
      tokenURL: OAUTH_TOKEN_URL,
    },
    async (accessToken: string, refreshToken: string, profile, callback) => {
      let user;

      try {
        user = await User.getUserData(accessToken);
      } catch (err) {
        callback(err);
        return;
      }

      callback(null, user);
    }
  )
);
