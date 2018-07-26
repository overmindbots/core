import { Guild } from '@overmindbots/shared-models';
import { createAsyncCatcher } from '@overmindbots/shared-utils/utils';
import cors from 'cors';
import express, { NextFunction, Request, Response } from 'express';
import passport from 'passport';
import logger from 'winston';
import {
  API_URL,
  DISCORD_CLIENT_ID,
  OAUTH_AUTHORIZATION_URL,
  OAUTH_CALLBACK_URL,
  PORT,
} from '~/constants';

interface OauthRequest extends Request {
  params: {
    guildDiscordId: string;
    userDiscordId: string;
  };
}

interface InviteRequest extends Request {
  params: {
    inviterDiscordId: string;
    guildDiscordId: string;
  };
}

function isOauthRequest(request: Request): request is OauthRequest {
  const { guildDiscordId, userDiscordId } = request.params;

  return !!guildDiscordId && !!userDiscordId;
}

function isInviteRequest(request: Request): request is InviteRequest {
  const { inviterDiscordId, guildDiscordId } = request.params;

  return !!inviterDiscordId && !!guildDiscordId;
}

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
 */
app.get(
  '/oauth/:guildDiscordId/:userDiscordId',
  asyncCatcher(async (req: Request, res: Response) => {
    if (!isOauthRequest(req)) {
      res.sendStatus(404);
      return;
    }
    const { guildDiscordId, userDiscordId } = req.params;

    const state = {
      guildDiscordId,
      userDiscordId,
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
  asyncCatcher(async (req: Request, res: Response, next: NextFunction) => {
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

/**
 * Route: /invite
 * validates that the guild exists and returns an html document with:
 * - OG Tags to display
 * - A js snippet to redirect to the invite link
 */
app.get(
  '/invite/:guildDiscordId/:inviterDiscordId',
  asyncCatcher(async (req, res) => {
    if (!isInviteRequest(req)) {
      res.sendStatus(404);
      return;
    }

    const { guildDiscordId, inviterDiscordId } = req.params;

    const guilds = await Guild.find();
    console.log('guilds', guilds);
    const guild = await Guild.findOne({ discordId: guildDiscordId });
    if (!guild) {
      // TODO: Send sexier 404 page
      res.sendStatus(404);
    }

    console.log('guildDiscordId', guildDiscordId);
    console.log('inviterDiscordId', inviterDiscordId);

    console.log('guild', guild);
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

const gracefulShutdown = () => {
  server.close();
};

process.once('SIGINT', gracefulShutdown);
process.once('SIGTERM', gracefulShutdown);
