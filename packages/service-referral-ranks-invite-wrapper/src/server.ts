import { createAsyncCatcher } from '@overmindbots/shared-utils/utils';
import cors from 'cors';
import express from 'express';
import passport from 'passport';
import logger from 'winston';
import {
  API_URL,
  DISCORD_CLIENT_ID,
  OAUTH_AUTHORIZATION_URL,
  PORT,
} from '~/constants';

const asyncCatcher = createAsyncCatcher();

const app = express();

app.use(cors());
app.use((req, res, next) => {
  console.debug('>> Receiving request');
  next();
});
app.use(passport.initialize());

/**
 * Initial route that redirects to oauth dialog
 * FIXME: This route should change to use guildId and userId
 */
app.get(
  '/oauth',
  passport.authenticate('oauth2', {
    scope: ['identify'],
  })
);
/**
 * Where the user is redirected after a successful Authentication
 */
app.get(
  '/oauth/callback',
  passport.authenticate('oauth2', {
    // NOTE: Maybe we want to redirect somewhere else to get data of people who rejected
    failureRedirect: OAUTH_AUTHORIZATION_URL,
    session: false,
  }),
  asyncCatcher(async (req, res) => {
    // const { id, username, discriminator } = req.user;
    // - Create/Get invite link for redirect
    // - ...Do stuff
    // - Redirect to invite link
    // res.redirect('<invite link here>'); // Redirect to inviteUrl
  })
);
const server = app.listen(PORT, () => {
  logger.info(`
    == Started server ==
    PORT: ${PORT}
    API_URL: ${API_URL}
    DISCORD_CLIENT_ID: ${DISCORD_CLIENT_ID}
  `);
});

// TODO: Close on sigint/sigterm
