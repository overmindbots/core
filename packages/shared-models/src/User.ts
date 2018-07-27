import axios from 'axios';
import mongoose from 'mongoose';

import { DISCORD_API_BASE_URL } from '@overmindbots/shared-utils/constants';
import { GraphQLUnauthenticatedError } from '@overmindbots/shared-utils/graphqlErrors';

import { Session, SessionDocument } from '@overmindbots/shared-models/Session';

export interface CreateOrUpdateFromOauthArgs {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface UserData {
  id: string;
  username: string;
  email?: string | undefined;
  avatar: string;
  discriminator: string;
}

export function isUserData(user: any): user is UserData {
  const { id, username, avatar, discriminator } = user;

  return !!id && !!username && !!avatar && !!discriminator;
}

export interface UserDocument extends mongoose.Document {
  discordId: string;
  displayName: string;
  email: string;
  avatar?: string;
  isAdmin: boolean;
  oauth: {
    required: true;
    type: mongoose.Schema.Types.Mixed;
    accessToken: string;
    refreshToken: string;
    expiresAt: typeof Date;
  };
  createSession(): Promise<SessionDocument>;
  getDiscordOauthToken(): Promise<string>;
}
export interface UserModel extends mongoose.Model<UserDocument> {
  createOrUpdateFromOauth(
    args: CreateOrUpdateFromOauthArgs
  ): Promise<typeof User>;
  getUserData(accessToken: string): Promise<UserData>;
}

const schema = new mongoose.Schema(
  {
    discordId: {
      type: String,
      required: true,
    },
    displayName: { type: String, required: true },
    email: { type: String, required: true },
    avatar: { type: String },
    isAdmin: {
      type: Boolean,
      default: false,
    },
    oauth: {
      required: true,
      type: mongoose.Schema.Types.Mixed,
      accessToken: {
        type: String,
        required: true,
      },
      refreshToken: {
        type: String,
        required: true,
      },
      expiresAt: {
        type: Date,
        required: true,
      },
    },
  },
  { timestamps: true }
);

schema.statics.createOrUpdateFromOauth = async ({
  accessToken,
  refreshToken,
  expiresIn,
}: CreateOrUpdateFromOauthArgs) => {
  const {
    email,
    id: discordId,
    username: displayName,
    avatar,
    error,
  } = await schema.statics.getUserData(accessToken);

  if (error) {
    throw new Error(`Discord OAuth2: ${error}`);
  }
  if (!email) {
    throw new Error('Discord OAuth2: No email was provided');
  }

  const user = await User.findOneAndUpdate(
    { email },
    {
      email,
      displayName,
      avatar,
      discordId,
      oauth: {
        accessToken,
        refreshToken,
        expiresAt: new Date(Date.now() + expiresIn),
      },
    },
    { upsert: true, new: true }
  );

  await user.save();

  return user;
};

schema.statics.getUserData = async function getUserData(accessToken: string) {
  const requestUrl = `${DISCORD_API_BASE_URL}/users/@me`;

  const result = await axios.get<UserData>(requestUrl, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  const resultBody = await result.data;

  return resultBody;
};

schema.methods.isOauthTokenExpired = function isOauthTokenExpired() {
  return this.oauth.expiresAt.getTime() - Date.now() <= 0;
};

schema.methods.createSession = async function createSession() {
  const session = new Session({
    user: this._id,
  });
  await session.save();
  return session;
};

schema.methods.getDiscordOauthToken = async function getDiscordOauthToken() {
  // TODO: Should refresh token here. For now revoke session,
  if (this.isOauthTokenExpired()) {
    throw new GraphQLUnauthenticatedError();
  }

  return this.oauth.accessToken;
};

schema.index({ discordId: 1 }, { unique: true });

/**
 * Represents a Discord User. We use this as our way for identifying users
 * in our web app too
 */
export const User = mongoose.model<UserDocument, UserModel>('User', schema);
