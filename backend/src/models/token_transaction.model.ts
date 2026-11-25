import mongoose, { Schema, model, Document } from 'mongoose';

export interface ITokenTransaction extends Document {
  userId: mongoose.Types.ObjectId;
  type: 'EARN' | 'CONVERT' | 'WITHDRAW';
  source: 'AI_USAGE' | 'MANUAL' | 'SYSTEM';
  amount: number; // positive for EARN, negative for CONVERT/WITHDRAW
  balanceAfter: number;
  referenceId?: mongoose.Types.ObjectId | string;
  destination?: string; // withdrawal target address
  createdAt: Date;
}

const tokenTransactionSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, required: true, enum: ['EARN', 'CONVERT', 'WITHDRAW'] },
  source: { type: String, required: true, enum: ['AI_USAGE', 'MANUAL', 'SYSTEM'] },
  amount: { type: Number, required: true },
  balanceAfter: { type: Number, required: true },
  referenceId: { type: Schema.Types.Mixed },
  destination: { type: String },
}, { timestamps: true });

tokenTransactionSchema.index({ userId: 1, createdAt: -1 });

// IMMUTABLE ledger: inserts only. Do not add update/delete paths.
export const TokenTransaction = model<ITokenTransaction>('TokenTransaction', tokenTransactionSchema);