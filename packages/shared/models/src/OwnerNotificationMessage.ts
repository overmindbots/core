import mongoose from 'mongoose';

import { BOT_TYPES } from '@overmindbots/shared-utils/src/constants';

export interface OwnerNotificationMessageDocument extends mongoose.Document {
  checksum: string;
  userDiscordId: string;
  botType: BOT_TYPES;
}
export interface OwnerNotificationMessageModel
  extends mongoose.Model<OwnerNotificationMessageDocument> {}

const schema = new mongoose.Schema(
  {
    checksum: {
      type: String,
      required: true,
    },
    userDiscordId: {
      type: String,
      required: true,
    },
    botType: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

schema.index({ checksum: 1, botType: 1, userDiscordId: 1 }, { unique: true });

/**
 * Keeps track of wether a certain notification has been sent to a Guild owner
 * or not. This is meant to be used for broadcasts
 */
export const OwnerNotificationMessage = mongoose.model<
  OwnerNotificationMessageDocument,
  OwnerNotificationMessageModel
>('OwnerNotificationMessage', schema);
