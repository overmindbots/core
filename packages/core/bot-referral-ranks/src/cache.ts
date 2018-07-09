// TODO: Move caching to a separate service instance
import { get, set } from 'lodash';
import logger from 'winston';
import { BOT_TYPE } from '~/constants';
import { BotInstance } from '~/shared/models';

interface Cache {
  prefixes: {
    [guildDiscordId: string]: string;
  };
}

/**
 * Small in memory cache
 */
class Cache {
  public store = {
    prefixes: {},
  };

  /**
   * Cache a value associated to a key
   */
  public set(key: string, value: string) {
    set(this.store, key, value);
  }

  /**
   * Get a cached value associated to a key
   * @param defaultValue value returned is no value is found, otherwise null
   */
  public get(key: string, defaultValue?: string) {
    return get(this.store, key, defaultValue);
  }

  /**
   * Get the prefix for a guild from the database
   */
  public getPrefix = async (
    guildDiscordId: string,
    defaultValue: string
  ): Promise<string> => {
    const cacheValue = this.get(`prefixes.${guildDiscordId}`);
    if (cacheValue) {
      return cacheValue;
    }

    const botInstance = await BotInstance.findOne({
      botType: BOT_TYPE,
      guildDiscordId,
    });

    if (!botInstance) {
      logger.error(`Bot instance not found for '${guildDiscordId}`);
      return defaultValue;
    }
    if (!botInstance.config) {
      logger.error(`Bot instance has no config object: '${guildDiscordId}`);
      return defaultValue;
    }

    const { prefix } = botInstance.config;

    if (!prefix) {
      return defaultValue;
    }

    return prefix;
  };
}

export const cache = new Cache();
