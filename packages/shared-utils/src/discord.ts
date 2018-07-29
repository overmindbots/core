import {
  DISCORD_API_BASE_URL,
  DISCORD_CDN_URL,
} from '@overmindbots/shared-utils/constants';
import axios from 'axios';

export interface DiscordAPIGuildResponse {
  name: string;
  icon: string;
  id: string;
}
export interface DiscordAPIGuildChannelsResponse
  extends Array<{
      id: string;
      type: number;
    }> {}

export interface DiscordAPICreateChannelInviteResponse {
  code: string;
  guild: {
    id: string;
    name: string;
    splash: string | null;
    icon: string | null;
  };
  channel: {
    id: string;
    name: string;
    type: number;
  };
}

export enum DiscordAPIAuthTypes {
  BOT = 'Bot',
  APP = 'Bearer',
}

export class DiscordAPI {
  private token: string;
  private authType: DiscordAPIAuthTypes;

  constructor({
    token,
    authType,
  }: {
    token: string;
    authType: DiscordAPIAuthTypes;
  }) {
    this.token = token;
    this.authType = authType;
  }

  // TODO: Add rate limit support
  private async makeGetRequest<T>(url: string) {
    const response = await axios.get<T>(`${DISCORD_API_BASE_URL}/${url}`, {
      headers: {
        Authorization: `${this.authType} ${this.token}`,
        'User-Agent': 'Overmind Bots (http://overmindbots.com)',
        'Content-Type': 'application/json',
      },
    });

    return response;
  }

  private async makePostRequest<T>(url: string, data: any) {
    const response = await axios.post<T>(
      `${DISCORD_API_BASE_URL}/${url}`,
      data,
      {
        headers: {
          Authorization: `${this.authType} ${this.token}`,
          'User-Agent': 'Overmind Bots (http://overmindbots.com)',
          'Content-Type': 'application/json',
        },
      }
    );

    return response;
  }

  public async getGuild(guildId: string) {
    let result;

    try {
      result = await this.makeGetRequest<DiscordAPIGuildResponse>(
        `guilds/${guildId}`
      );
    } catch (err) {
      return null;
    }

    return result.data;
  }

  public async getGuildChannels(guildId: string) {
    let result;

    try {
      result = await this.makeGetRequest<DiscordAPIGuildChannelsResponse>(
        `guilds/${guildId}/channels`
      );
    } catch (err) {
      return null;
    }

    return result.data;
  }

  public async createChannelInvite(
    channelId: string,
    options: {
      max_age?: number;
      max_uses?: number;
      temporary?: boolean;
      unique?: boolean;
    }
  ) {
    let result;

    try {
      result = await this.makePostRequest<
        DiscordAPICreateChannelInviteResponse
      >(`channels/${channelId}/invites`, options);
    } catch (err) {
      return null;
    }

    return result.data;
  }
}

/**
 * Returns an guild icon's image url
 * @param guildDiscordId id of the guild who owns te icon
 * @param iconHash string given by discord used to retrieve the icon
 * @param opts.size size of the icon's image
 */
export function buildGuildIconUrl(
  guildDiscordId: string,
  iconHash: string,
  { size }: { size?: string } = { size: '100px' }
) {
  return (
    `${DISCORD_CDN_URL}/icons/${guildDiscordId}/${iconHash}` +
    `.png?size=${size}`
  );
}
