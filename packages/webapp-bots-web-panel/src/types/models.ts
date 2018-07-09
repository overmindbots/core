export interface User {
  id: string;
  displayName: string;
  discordAccessToken?: string;
  isAdmin: boolean;
  avatar?: string;
  discordId: string;
}
