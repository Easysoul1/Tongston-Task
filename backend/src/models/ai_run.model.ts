import mongoose, { Schema, model, Document } from 'mongoose';

export interface IAIRun extends Document {
  contentId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  promptVersion: string;
  tone: string;
  length: string;
  status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'TIMEOUT';
  output?: string;
  latencyMs?: number;
  tokensAwarded?: number;
  errorMessage?: string;
  createdAt: Date;
}

const aiRunSchema = new Schema({
  contentId: { type: Schema.Types.ObjectId, ref: 'ContentItem', required: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  promptVersion: { type: String, default: 'v1' },
  tone: { type: String, required: true },
  length: { type: String, required: true },
  status: { type: String, required: true, enum: ['PENDING', 'SUCCESS', 'FAILED', 'TIMEOUT'], default: 'PENDING' },
  output: { type: String },
  latencyMs: { type: Number },
  tokensAwarded: { type: Number },
  errorMessage: { type: String },
}, { timestamps: true });

aiRunSchema.index({ contentId: 1, userId: 1, createdAt: 1 });
aiRunSchema.index({ contentId: 1 });
aiRunSchema.index({ userId: 1 });

export const AIRun = model<IAIRun>('AIRun', aiRunSchema);