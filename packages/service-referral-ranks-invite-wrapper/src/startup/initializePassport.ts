import { User } from '@overmindbots/shared-models';
import passport from 'passport';
import { Strategy } from 'passport-oauth2';
import { OAUTH_CALLBACK_URL } from '~/constants';

if (!process.env.DISCORD_CLIENT_ID) {
  throw new Error('Env variable "DISCORD_CLIENT_ID" is missing.');
}
if (!process.env.DISCORD_CLIENT_SECRET) {
  throw new Error('Env variable "DISCORD_CLIENT_SECRET" is missing.');
}

passport.use(
  new Strategy(
    {
      clientID: process.env.DISCORD_CLIENT_ID,
      clientSecret: process.env.DISCORD_CLIENT_SECRET,
      callbackURL: OAUTH_CALLBACK_URL,
      authorizationURL: 'https://discordapp.com/api/oauth2/authorize',
      tokenURL: 'https://discordapp.com/api/oauth2/token',
    },
    async (accessToken: string, refreshToken: string, profile, callback) => {
      let user;

      console.log(refreshToken);
      console.log(profile);
      console.log(accessToken);

      try {
        // user = await User.createOrUpdateFromOauth({
        //   accessToken,
        //   expiresIn: Date.now() + 1000 * 60 * 60 * 24 * 6,
        // });
      } catch (err) {
        callback(err);
        return;
      }

      callback(null, user);
    }
  )
);
