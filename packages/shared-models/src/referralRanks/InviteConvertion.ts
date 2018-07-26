import mongoose from 'mongoose';

export interface InviteConvertionDocument extends mongoose.Document {
  guildDiscordId: string;
  inviterDiscordId: string;
  inviteeDiscordId: string;
  converted: boolean;
}

export interface InviteConvertionModel
  extends mongoose.Model<InviteConvertionDocument> {
  getTopScores(
    guildDiscordId: string,
    limit?: number
  ): Promise<InviteConvertionScore[]>;
}

const schema = new mongoose.Schema({
  guildDiscordId: {
    required: true,
    type: String,
  },
  inviterDiscordId: {
    required: true,
    type: String,
  },
  inviteeDiscordId: {
    required: true,
    type: String,
  },
  converted: {
    default: false,
    type: Boolean,
  },
});

schema.index(
  { guildDiscordId: 1, inviterDiscordId: 1, inviteeDiscordId: 1 },
  { unique: true }
);

export interface InviteConvertionScore {
  inviterDiscordId: string;
  score: number;
  username: string;
}

schema.statics.getTopScores = async function(
  guildDiscordId: string,
  limit: number
) {
  // TODO: Implement this method, this is just a placeholder
  return [].slice(0, limit + guildDiscordId.length) as InviteConvertionScore[];
};

/**
 * Represents the association between an "inviter" user and an "invited" user
 * through our internal invite link
 */
export const InviteConvertion = mongoose.model<
  InviteConvertionDocument,
  InviteConvertionModel
>('Bot-ReferralRanks-InviteConvertion', schema);
