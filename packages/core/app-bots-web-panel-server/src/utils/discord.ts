import P from 'bluebird';
import { Permissions } from 'discord.js';
import { filter, get, map, set } from 'lodash';
import fetch from 'node-fetch';
import {
  DISCORD_API_BASE_URL,
  DISCORD_ERROR_UNAUTHENTICATED,
  DISCORD_RATE_LIMIT_TIME,
} from '~/constants';
import { UnexpectedError } from '~/shared/errors';
import {
  GraphQLRateLimitError,
  GraphQLUnauthenticatedError,
} from '~/shared/graphqlErrors';
import { Guild, UserDocument } from '@overmindbots/shared-models';
import { asyncDelay } '@overmindbots/shared-utils';

// Keeps track of the last time a request of a certain resource was performed
// Should use a Redis cache for this
interface RequestTimes {
  [accessToken: string]: {
    [requestRoute: string]: number;
  };
}
const requestTimes: RequestTimes = {};
interface RequestCaches {
  [accessToken: string]: {
    [requestRoute: string]: any;
  };
}
const requestCaches: RequestCaches = {};

// TODO: Use this class to instance per request or session so that we can
// reuse things like oauth token
interface ConstructorProps {
  accessToken: string;
}

function isErrorResponse(response: AnyResponse): response is ErrorResponse {
  return (response as ErrorResponse).code !== undefined;
}
function isRateLimitResponse(
  response: AnyResponse
): response is RateLimitResponse {
  const res = response as RateLimitResponse;
  return res && res.retry_after !== undefined;
}

export interface ErrorResponse {
  code?: number;
  message?: string;
}
export interface RateLimitResponse {
  message?: string;
  retry_after: number;
}

export interface Guild extends ErrorResponse, RateLimitResponse {
  name: string;
  id: string;
  icon: string;
  owner: boolean;
  permissions: number;
}

export type AnyResponse = Guild | [Guild] | ErrorResponse;

export default class DiscordClient {
  accessToken: string;

  constructor({ accessToken }: ConstructorProps) {
    this.accessToken = accessToken;
  }

  private _makeRequest = async (url: string, method: string) => {
    const response = await (await fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        'User-Agent': 'BotAlchemy (https://www.botalchemy.com)',
      },
    })).json();

    // Update time of request
    set(requestTimes, [this.accessToken, url], Date.now());
    const currentRequestTime = Date.now();

    if (isErrorResponse(response)) {
      if (response.message === DISCORD_ERROR_UNAUTHENTICATED) {
        throw new GraphQLUnauthenticatedError();
      } else {
        throw new UnexpectedError(response.message);
      }
    }

    // Update cached value
    set(requestCaches, [this.accessToken, url], response);

    // Set expiration timer on response to clear memory
    asyncDelay(DISCORD_RATE_LIMIT_TIME)
      .then(() => {
        const lastRequestTime = get(requestTimes, [this.accessToken, url]);
        if (lastRequestTime === currentRequestTime) {
          delete requestTimes[this.accessToken][url];
          delete requestCaches[this.accessToken][url];
        }
      })
      .catch(err => {
        throw err;
      });
  };

  makeRequest = async (path: string, method = 'get') => {
    const url = `${DISCORD_API_BASE_URL}${path}`;
    const lastRequestTime = get(requestTimes, [this.accessToken, url]) || 0;
    const lastRequestTimeAgo = Date.now() - lastRequestTime;
    const cachedResponse = get(requestCaches, [this.accessToken, url]);

    let waitTime = DISCORD_RATE_LIMIT_TIME - lastRequestTimeAgo;
    waitTime = waitTime > 0 ? waitTime : 0;

    if (waitTime > 0 && cachedResponse) {
      return cachedResponse;
    }

    await asyncDelay(waitTime);
    await this._makeRequest(url, method);

    const result = get(requestCaches, [this.accessToken, url]);
    return result;
  };

  guilds = async (updateCache = true, user: UserDocument) => {
    const response: [Guild] = await this.makeRequest('/users/@me/guilds');
    if (isRateLimitResponse(response)) {
      throw new GraphQLRateLimitError();
    }

    const guilds = map(
      filter(response, ({ permissions }) => {
        const resolvedPermissions = new Permissions(permissions);
        return resolvedPermissions.has('MANAGE_GUILD');
      }),
      ({ id: discordId, name, icon, permissions }) => ({
        discordId,
        name,
        icon,
        permissions,
      })
    );

    if (updateCache) {
      if (!user) {
        throw new Error('User must be passed if updateCache is true');
      }

      await P.each(guilds, async guild => {
        await Guild.findOneAndUpdate(
          { discordId: guild.discordId },
          {
            ...guild,
            userDiscordId: user.discordId,
          },
          { upsert: true }
        );
      });
    }

    return guilds;
  };
}
