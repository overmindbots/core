import { each, reduce } from 'lodash';

import { DISCORD_BASE_ADD_BOT_URL } from '@overmindbots/shared-utils/constants';

/**
 * Verifies that a list environment variables exist
 * @param names environment variable names to define
 * TODO: Improve type inference. right now it doesn't return the right types
 */
export function verifyEnvVariables(names: string[]) {
  interface EnvVar {
    [propname: string]: string;
  }
  let errorMessage = 'The following ENV variables are not set:\n';
  const envVars: EnvVar = {};
  const invalidNames: string[] = [];

  each(names, name => {
    if (!process.env[name]) {
      invalidNames.push(name);
    }
    envVars[name] = process.env[name] as string;
  });

  if (invalidNames.length) {
    errorMessage = reduce(
      invalidNames,
      (total, invalidName) => `${total}$- ${invalidName}\n`,
      errorMessage
    );
    throw new Error(errorMessage);
  }

  return envVars;
}

/**
 * Creates an URL to add a bot
 * @param clientId bot's client id
 * @param guildDiscordId if passed, preselect a guild in Discord's oauth dialog
 * @param permissionsByteString a string representing the permissions a bot
 * requires
 * @param state an object with miscellaneous extra information to carry to the
 * redirect URL if the oauth process succeeds
 * @param apiResponseUrl url to take the user to after a successful oauth
 * process
 */
export function buildAddBotUrl({
  clientId,
  guildDiscordId,
  permissionsByteString,
  state,
  apiResponseUrl,
}: {
  clientId: string;
  guildDiscordId?: string;
  permissionsByteString: string;
  state: { [key: string]: any } | null;
  apiResponseUrl: string;
}) {
  const encodedRedirectUrl = encodeURIComponent(apiResponseUrl);
  const stateString =
    (state &&
      `&state=${Buffer.from(JSON.stringify(state)).toString('base64')}`) ||
    '';
  const guildString = (guildDiscordId && `&guild_id=${guildDiscordId}`) || '';
  const url =
    `${DISCORD_BASE_ADD_BOT_URL}?` +
    `client_id=${clientId}` +
    `&permissions=${permissionsByteString}` +
    `&redirect_uri=${encodedRedirectUrl}` +
    '&response_type=code' +
    '&scope=bot%20identify' +
    `${stateString}` +
    `${guildString}`;
  return url;
}
/**
 * Creates a reusable function that can be used to wrap async functions so that
 * it deals with exceptions thrown by them
 * @param onCatch callback that runs when an exception occurs
 */
export function createAsyncCatcher(
  onCatch: (err: Error) => any = () => {
    /* noop */
  }
) {
  return function catchAsync(
    asyncFunction: (...args: any[]) => Promise<any>
  ): (...args: any[]) => void {
    return (...asyncArgs: any[]) => {
      asyncFunction(...asyncArgs).catch(onCatch);
    };
  };
}

/**
 * Returns a promise that will resolve after a certain amount of miliseconds
 */
export const asyncDelay = (delay: number) => {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve();
    }, delay);
  });
};
