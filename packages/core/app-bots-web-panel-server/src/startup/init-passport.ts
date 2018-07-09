import passport from 'passport';
import { Strategy as DiscordStrategy } from 'passport-discord-oauth2';
import { DISCORD_CALLBACK_URL } from '~/constants';
import { User } from '@overmindbots/shared-models';

if (!process.env.DISCORD_CLIENT_ID) {
  throw new Error('Env variable "DISCORD_CLIENT_ID" is missing.');
}
if (!process.env.DISCORD_CLIENT_SECRET) {
  throw new Error('Env variable "DISCORD_CLIENT_SECRET" is missing.');
}

passport.use(
  new DiscordStrategy(
    {
      clientID: process.env.DISCORD_CLIENT_ID,
      clientSecret: process.env.DISCORD_CLIENT_SECRET,
      callbackURL: DISCORD_CALLBACK_URL,
      scope: 'identify email guilds',
    },
    async (accessToken, refreshToken, profile, callback) => {
      let user;

      try {
        user = await User.createOrUpdateFromOauth({
          accessToken,
          refreshToken,
          expiresIn: Date.now() + 1000 * 60 * 60 * 24 * 6,
        });
      } catch (err) {
        callback(err);
        return;
      }

      callback(null, user);
    }
  )
);
