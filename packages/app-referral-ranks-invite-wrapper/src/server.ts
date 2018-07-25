import { createAsyncCatcher } from '@overmindbots/shared-utils/utils';
import cors from 'cors';
import express from 'express';
import passport from 'passport';
import logger from 'winston';
import {
  API_URL,
  DISCORD_CLIENT_ID,
  OAUTH_AUTHORIZATION_URL,
  OAUTH_CALLBACK_URL,
  PORT,
} from '~/constants';

const asyncCatcher = createAsyncCatcher();

const app = express();

app.use(cors());
app.use(({}, {}, next) => {
  console.debug('>> Receiving request');
  next();
});
app.use(passport.initialize());

/**
 * Initial route that redirects to oauth dialog
 * FIXME: This route should change to use guildId and userId
 */
app.get(
  '/oauth/:guildId/:userId',
  asyncCatcher(async (req, res) => {
    const { guildId, userId }: { guildId: string; userId: string } = req.params;

    const state = {
      guildId,
      userId,
    };

    const stateStr = JSON.stringify(state);
    const encodedState = Buffer.from(stateStr).toString('base64');

    const url =
      `${OAUTH_AUTHORIZATION_URL}?` +
      `client_id=${DISCORD_CLIENT_ID}` +
      `&redirect_uri=${encodeURIComponent(OAUTH_CALLBACK_URL)}` +
      '&response_type=code' +
      '&scope=identify' +
      `&state=${encodedState}`;

    res.redirect(url);
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
  asyncCatcher(async (req, res, next) => {
    console.log(req.query);
    const stateStr = Buffer.from(req.query.state, 'base64').toString();
    const obj = JSON.parse(stateStr);
    console.log(obj);
    console.log(req.user);
    // const { id, username, discriminator } = req.user;
    // - Create/Get invite link for redirect
    // - ...Do stuff
    // - Redirect to invite link
    // res.redirect('<invite link here>'); // Redirect to inviteUrl
    next();
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

/**
 * Do all cleanup operations
 */
const terminate = () => {
  server.close();
};

process.once('SIGINT', terminate);
process.once('SIGTERM', terminate);
