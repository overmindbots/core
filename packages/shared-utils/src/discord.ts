import { DISCORD_API_BASE_URL } from '@overmindbots/shared-utils/constants';
import axios from 'axios';

export interface DiscordAPIGuildResponse {
  name: string;
  icon: string;
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
  private async makeRequest<T>(url: string) {
    const response = await axios.get<T>(`${DISCORD_API_BASE_URL}/${url}`, {
      headers: {
        Authorization: `${this.authType} ${this.token}`,
        'User-Agent': 'Overmind Bots (http://overmindbots.com)',
        'Content-Type': 'application/json',
      },
    });

    return response;
  }

  public async getGuild(guildId: string) {
    let result;

    try {
      result = await this.makeRequest<DiscordAPIGuildResponse>(
        `guilds/${guildId}`
      );
    } catch (err) {
      return null;
    }

    return result.data;
  }
}
