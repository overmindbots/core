import mongoose from 'mongoose';

export interface RoleDocument extends mongoose.Document {
  discordId: string;
  guildDiscordId: string;
  name: string;
  color: number;
  position: number;
  permissions: number;
  managed: boolean;
  mentionable: boolean;
}

export interface RoleModel extends mongoose.Model<RoleDocument> {}

const schema = new mongoose.Schema({
  discordId: {
    type: String,
    required: true,
  },
  guildDiscordId: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  color: {
    type: Number,
    required: true,
  },
  position: {
    type: Number,
    required: true,
  },
  permissions: {
    type: Number,
    required: true,
  },
  managed: {
    type: Boolean,
    required: true,
  },
  mentionable: {
    type: Boolean,
    required: true,
  },
});

schema.index({ discordGuildId: 1, discordId: 1 }, { unique: true });
schema.index({ discordGuildId: 1 });

/**
 * Represents a Role in a Guild
 */
export const Role = mongoose.model<RoleDocument, RoleModel>('Role', schema);
