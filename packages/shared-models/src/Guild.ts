import mongoose from 'mongoose';

export interface GuildDocument extends mongoose.Document {
  discordId: string;
  userDiscordId: string;
  name: string;
  icon: string;
  memberCount: number;
  onlineCount?: number;
}

export interface GuildModel extends mongoose.Model<GuildDocument> {}

const schema = new mongoose.Schema({
  name: String,
  discordId: {
    type: String,
    required: true,
  },
  userDiscordId: {
    type: String,
    required: true,
  },
  icon: {
    type: String,
  },
  memberCount: Number,
  onlineCount: Number,
});

schema.index({ discordId: 1 }, { unique: true });

/**
 * Represents a unique Guild in discord
 */
export const Guild = mongoose.model<GuildDocument, GuildModel>('Guild', schema);
