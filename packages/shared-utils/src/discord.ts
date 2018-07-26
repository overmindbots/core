import { DISCORD_API_BASE_URL } from '@overmindbots/shared-utils/constants';
import axios, { AxiosResponse } from 'axios';

export interface DiscordAPIGuildResponse extends AxiosResponse {
  data: {
    icon: string;
    name: string;
  };
}
export enum DiscordAPIAuthTypes {
  BOT = 'Bot',
  APP = 'Bearer',
}

export class DiscordAPI {
  private token: string;
  private tokenType: DiscordAPIAuthTypes;

  constructor({
    token,
    tokenType,
  }: {
    token: string;
    tokenType: DiscordAPIAuthTypes;
  }) {
    this.token = token;
    this.tokenType = tokenType;
  }

  private async makeRequest(url: string) {
    const response = await axios.get<DiscordAPIGuildResponse>(
      `${DISCORD_API_BASE_URL}/${url}`,
      {
        headers: {
          Authorization: `${this.tokenType} ${this.token}`,
          'User-Agent': 'Overmind Bots (http://overmindbots.com)',
          'Content-Type': 'application/json',
        },
      }
    );

    return response;
  }

  public async getGuild(guildId: string) {
    const result = await this.makeRequest(`guilds/${guildId}`);
    return result;
  }
}
