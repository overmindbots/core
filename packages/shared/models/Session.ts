import mongoose from 'mongoose';
import uuid from 'uuid/v4';

import { UserDocument } from './User';

const MAX_SESSIONS = 5;

export interface SessionDocument extends mongoose.Document {
  token: string;
  user: UserDocument;
}
export interface SessionModel extends mongoose.Model<SessionDocument> {}

const schema = new mongoose.Schema(
  {
    token: {
      type: String,
      default: uuid,
      required: true,
      unique: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

schema.post('save', async function limitSessionCount(
  this: SessionModel & SessionDocument,
  _error: any,
  _res: any,
  next: () => void
) {
  if (this.isNew) {
    const count = await this.count({ user: this.user });
    if (count > MAX_SESSIONS) {
      const sessions = await this.findOne({ user: this.user }).sort({
        createdAt: 'asc',
      });
      if (sessions !== null) {
        await sessions.remove();
      }
    }
  }
  next();
});

/**
 * A Session to our web app that belongs to a User
 */
export const Session = mongoose.model<SessionDocument, SessionModel>(
  'Session',
  schema
);
