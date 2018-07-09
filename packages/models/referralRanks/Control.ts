import mongoose from 'mongoose';

export interface ControlDocument extends mongoose.Document {
  version: number;
}
export interface ControlModel extends mongoose.Model<ControlDocument> {}

const schema = new mongoose.Schema({
  version: Number,
});

/**
 * Used to keep track of migration versions. This is probably going to be
 * replaced for a more robust migrations system
 */
export const Control = mongoose.model<ControlDocument, ControlModel>(
  'Bot-ReferralRanks-Control',
  schema
);
