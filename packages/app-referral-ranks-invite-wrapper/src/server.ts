import { isUserData } from '@overmindbots/shared-models';
import { Guild } from '@overmindbots/shared-models';
import {
  CertainReferral,
  WrappedInvite,
} from '@overmindbots/shared-models/referralRanks';
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
  APP_URL,
  BOT_TOKEN,
  DISCORD_CLIENT_ID,
  DISCORD_INVITE_PREFIX,
  OAUTH_AUTHORIZATION_URL,
  OAUTH_CALLBACK_URL,
  PORT,
} from '~/constants';

import inviteViewTemplate from './htmlTemplates/invite.html.handlebars';
import { getGlobalUrl } from './utils/getGlobalUrl';

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
 * Where the user is redirected after a successful Authentication
 */
app.get(
  '/oauth/callback',
  passport.authenticate('oauth2', {
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
 * validates that the guild exists and returns an html document with:
 * - OG Tags to display
 * - A JS snippet to redirect to the invite link
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

    const state = {
      guildDiscordId,
      inviterDiscordId,
    };

    const stateStr = JSON.stringify(state);
    const encodedState = Buffer.from(stateStr).toString('base64');
    const redirectUrl =
      `${OAUTH_AUTHORIZATION_URL}?` +
      `client_id=${DISCORD_CLIENT_ID}` +
      `&redirect_uri=${encodeURIComponent(OAUTH_CALLBACK_URL)}` +
      '&response_type=code' +
      '&scope=identify' +
      `&state=${encodedState}`;

    console.log('redirectUrl', redirectUrl);

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
      inviteDescription: '', // TODO: Allow customization of this
      thumbnail_width: 100,
      thumbnail_height: 100,
      author_name: name,
      provider_name: 'YOU HAVE BEEN INVITED TO JOIN THIS DISCORD SERVER',
      author_url: `${globalUrl}${req.path}`,
      thumbnail_url: iconUrl,
      title: 'Join Server',
    };
    console.log(oembedResponse);
    const oembedEncoded = new Buffer(JSON.stringify(oembedResponse)).toString(
      'base64'
    );

    const htmlResponse = inviteViewTemplate({
      redirectUrl,
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
 * Returns a json object with oembed content
 */
app.get(
  '/oembed/invite/:encodedResponse.json',
  asyncCatcher(async (req: Request, res: Response) => {
    const oembedResponse = Buffer.from(
      req.params.encodedResponse,
      'base64'
    ).toString();
    const jsonResponse = JSON.parse(oembedResponse);
    logger.info('==> Responding to oEmbed request with:');
    logger.info(jsonResponse);
    res.json(jsonResponse);
  })
);

const server = app.listen(PORT, () => {
  logger.info(`
    == Started server ==
    PORT: ${PORT}
    APP_URL: ${APP_URL}
    DISCORD_CLIENT_ID: ${DISCORD_CLIENT_ID}
  `);
});

const gracefulShutdown = () => {
  server.close();
};

process.once('SIGINT', gracefulShutdown);
process.once('SIGTERM', gracefulShutdown);
