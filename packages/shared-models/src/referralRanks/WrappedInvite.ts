import mongoose from 'mongoose';

export interface WrappedInviteDocument extends mongoose.Document {
  guildDiscordId: string;
  code: string;
}
export interface WrappedInviteModel
  extends mongoose.Model<WrappedInviteDocument> {}

const schema = new mongoose.Schema({
  code: {
    required: true,
    type: String,
  },
  guildDiscordId: {
    required: true,
    type: String,
  },
});

schema.index({ guildDiscordId: 1 }, { unique: true });
schema.index({ code: 1 }, { unique: true });

/**
 * Represents a wrapped invite link for a guild
 */
export const WrappedInvite = mongoose.model<
  WrappedInviteDocument,
  WrappedInviteModel
>('Bot-ReferralRanks-WrappedInvite', schema);
