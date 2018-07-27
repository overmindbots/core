import { Guild } from '@overmindbots/shared-models';
import {
  buildGuildIconUrl,
  DiscordAPI,
  DiscordAPIAuthTypes,
} from '@overmindbots/shared-utils/discord';
import { createAsyncCatcher } from '@overmindbots/shared-utils/utils';
import cors from 'cors';
import express, { Request, Response } from 'express';
import formatNumber from 'format-number';
import { isNumber } from 'lodash';
import passport from 'passport';
import logger from 'winston';
import {
  API_URL,
  BOT_TOKEN,
  DISCORD_CLIENT_ID,
  OAUTH_AUTHORIZATION_URL,
  OAUTH_CALLBACK_URL,
  PORT,
} from '~/constants';

import inviteViewTemplate from './htmlTemplates/invite.html.handlebars';
import { getGlobalUrl } from './utils/getGlobalUrl';

interface InviteRequest extends Request {
  params: {
    inviterDiscordId: string;
    guildDiscordId: string;
  };
}

function isInviteRequest(request: Request): request is InviteRequest {
  return !!request.params.inviterDiscordId && !!request.params.guildDiscordId;
}

const discordAPIClient = new DiscordAPI({
  token: BOT_TOKEN,
  authType: DiscordAPIAuthTypes.BOT,
});
const asyncCatcher = createAsyncCatcher(error => {
  console.error(error);
});
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

/**
 * Route: /invite
 * validates that the guild exists and returns an html document with:
 * - OG Tags to display
 * - A js snippet to redirect to the invite link
 * - Oembed url (which cointains the oembed response encoded in base64)
 */
app.get(
  '/invite/:guildDiscordId/:inviterDiscordId',
  asyncCatcher(async (req: Request, res: Response) => {
    if (!isInviteRequest(req)) {
      res.sendStatus(404);
      return;
    }

    const { guildDiscordId, inviterDiscordId } = req.params;
    const guild = await discordAPIClient.getGuild(guildDiscordId);

    if (!guild) {
      res.sendStatus(404);
      return;
    }

    let memberCount;
    let onlineCount;
    let membersText = '';
    const { icon, name, id } = guild;
    const dbGuild = await Guild.findOne({ discordId: id });
    if (dbGuild) {
      memberCount = dbGuild.memberCount;
      if (dbGuild.onlineCount) {
        onlineCount = dbGuild.onlineCount;
      }
    }

    // TODO: Check what the caching time is
    if (isNumber(memberCount)) {
      membersText = `▪️ ${formatNumber()(memberCount)} members`;
      if (isNumber(onlineCount)) {
        membersText += `\n▫️ ${formatNumber()(onlineCount)} online`;
      }
    }

    const iconUrl = buildGuildIconUrl(id, icon);
    const globalUrl = await getGlobalUrl();
    const oembedResponse = {
      version: '1.0',
      type: 'link',
      thumbnail_width: 100,
      thumbnail_height: 100,
      author_name: name,
      provider_name: 'YOU HAVE BEEN INVITED TO JOIN THIS DISCORD SERVER',
      author_url: `${globalUrl}${req.path}`,
      thumbnail_url: iconUrl,
      title: 'Join Server',
    };
    const oembedEncoded = new Buffer(JSON.stringify(oembedResponse)).toString(
      'base64'
    );

    const htmlResponse = inviteViewTemplate({
      iconUrl,
      membersText,
      guildName: name,
      linkUrl: `${globalUrl}/invite/${guildDiscordId}/${inviterDiscordId}`,
      oembedUrl: `${globalUrl}/oembed/invite/${oembedEncoded}.json`,
    });

    res.send(htmlResponse);
    return;
  })
);
/**
 * Route: oembed invite endpoint
 * Returns a json object with oembed content
 */
app.get(
  '/oembed/invite/:encodedResponse.json',
  asyncCatcher(async (req: Request, res: Response) => {
    console.log('req', req.params);
    const oembedResponse = Buffer.from(
      req.params.encodedResponse,
      'base64'
    ).toString();
    console.log('oembedResponse', oembedResponse);
    const jsonResponse = JSON.parse(oembedResponse);
    logger.info('==> Responding to oEmbed request with:');
    logger.info(jsonResponse);
    console.log('jsonResponse');
    res.json(jsonResponse);
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
