import { isUserData } from '@overmindbots/shared-models';
import {
  CertainReferral,
  WrappedInvite,
} from '@overmindbots/shared-models/referralRanks';
import {
  DiscordAPI,
  DiscordAPIAuthTypes,
} from '@overmindbots/shared-utils/discord';
import { createAsyncCatcher } from '@overmindbots/shared-utils/utils';
import cors from 'cors';
import express, { Request, Response } from 'express';
import passport from 'passport';
import logger from 'winston';
import {
  API_URL,
  BOT_TOKEN,
  DISCORD_CLIENT_ID,
  DISCORD_INVITE_PREFIX,
  OAUTH_AUTHORIZATION_URL,
  OAUTH_CALLBACK_URL,
  PORT,
} from '~/constants';

interface InviteParams {
  guildDiscordId: string;
  inviterDiscordId: string;
}

interface OauthRequest extends Request {
  params: InviteParams;
}

interface InviteRequest extends Request {
  params: InviteParams;
}

function isOauthRequest(request: Request): request is OauthRequest {
  const { guildDiscordId, inviterDiscordId } = request.params;

  return !!inviterDiscordId && !!guildDiscordId;
}

function isInviteRequest(request: Request): request is InviteRequest {
  const { inviterDiscordId, guildDiscordId } = request.params;

  return !!inviterDiscordId && !!guildDiscordId;
}

function isInviteParams(params: any): params is InviteParams {
  const { inviterDiscordId, guildDiscordId } = params;

  return !!inviterDiscordId && !!guildDiscordId;
}

const discordAPIClient = new DiscordAPI({
  token: BOT_TOKEN,
  authType: DiscordAPIAuthTypes.BOT,
});

/**
 * Creates a unified invite for the specified guild via the Discord API
 * and inserts it into the database. Returns the invite database object
 *
 * We use "find or create" strategies in both the Discord API and our database
 * in case this function is called by multiple users at the same time
 */
const createGuildInvite = async (guildDiscordId: string) => {
  const channels = await discordAPIClient.getGuildChannels(guildDiscordId);

  if (!channels) {
    throw new Error(`Couldn't retrieve channels for guild ${guildDiscordId}`);
  }

  const defaultTextChannel = channels.filter(channel => channel.type === 0)[0];

  if (!defaultTextChannel) {
    throw new Error(`There are no text channels in guild ${guildDiscordId}`);
  }

  /**
   * By using unique: false we tell discord to reuse a previous
   * similar invite if it already exists instead of creating a new one
   */
  const invite = await discordAPIClient.createChannelInvite(
    defaultTextChannel.id,
    {
      max_age: 0,
      max_uses: 0,
      unique: false,
      temporary: false,
    }
  );

  if (!invite) {
    throw new Error(`Couldn't create invite for guild ${guildDiscordId}`);
  }

  const { code } = invite;
  const inviteDocument = {
    code,
    guildDiscordId,
  };

  return await WrappedInvite.findOneAndUpdate(inviteDocument, inviteDocument, {
    upsert: true,
    new: true,
  });
};

const asyncCatcher = createAsyncCatcher(error => {
  logger.error(error.message, error);
});

const app = express();

app.use(cors());
app.use(({}, {}, next) => {
  logger.debug('>> Receiving request');
  next();
});
app.use(passport.initialize());

/**
 * Initial route that redirects to oauth dialog
 */
app.get(
  '/oauth/:guildDiscordId/:inviterDiscordId',
  asyncCatcher(async (req: Request, res: Response) => {
    if (!isOauthRequest(req)) {
      res.sendStatus(500);
      return;
    }

    const stateStr = JSON.stringify(req.params);
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
  asyncCatcher(async (req: Request, res: Response) => {
    const stateStr = Buffer.from(req.query.state, 'base64').toString();
    const state = JSON.parse(stateStr);
    const user = req.user;

    if (!isInviteParams(state) || !isUserData(user)) {
      res.sendStatus(500);
      return;
    }

    const { guildDiscordId, inviterDiscordId } = state;
    const { id: inviteeDiscordId } = user;
    let invite = await WrappedInvite.findOne({ guildDiscordId });

    /**
     * If the invite is not in our database, we create it
     */
    if (!invite) {
      try {
        logger.info(`[${guildDiscordId}] Invite missing, creating...`);
        invite = await createGuildInvite(guildDiscordId);
      } catch (err) {
        logger.error(err.message, err);
      }
    }

    if (!invite) {
      res.sendStatus(500);
      return;
    }

    logger.info(
      `[${guildDiscordId}] New referral: ${inviterDiscordId} invited \
${inviteeDiscordId}`
    );
    CertainReferral.create({
      guildDiscordId,
      inviterDiscordId,
      inviteeDiscordId,
      timestamp: Date.now(),
      fulfilled: false,
    });

    res.redirect(`${DISCORD_INVITE_PREFIX}/${invite.code}`); // Redirect to inviteUrl
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

    console.log('guildDiscordId', guildDiscordId);
    const guild = await discordAPIClient.getGuild(guildDiscordId);

    console.log('guild', guild);

    if (!guild) {
      res.sendStatus(404);
      return;
    }

    const { icon, name } = guild;

    console.log('guild', guild);
    res.sendStatus(200);

    /**
     * 1. Get Icon URL
     * 2. Make template file
     * 3. Build template and send
     */
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
