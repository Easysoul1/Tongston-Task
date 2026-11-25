import mongoose, { Schema, model, Document } from 'mongoose';

export interface IContractConversion extends Document {
  userId: mongoose.Types.ObjectId;
  fromToken: string;
  toAsset: 'MOCK_USDT' | 'MOCK_ETH';
  amount: number;
  exchangeRate: number;
  txHashMock: string;
  status: 'PENDING' | 'CONFIRMED' | 'FAILED';
  createdAt: Date;
}

const contractConversionSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  fromToken: { type: String, required: true },
  toAsset: { type: String, required: true, enum: ['MOCK_USDT', 'MOCK_ETH'] },
  amount: { type: Number, required: true },
  exchangeRate: { type: Number, required: true },
  txHashMock: { type: String, required: true },
  status: { type: String, required: true, enum: ['PENDING', 'CONFIRMED', 'FAILED'], default: 'CONFIRMED' },
}, { timestamps: true });

contractConversionSchema.index({ userId: 1, createdAt: -1 });

export const ContractConversion = model<IContractConversion>('ContractConversion', contractConversionSchema);