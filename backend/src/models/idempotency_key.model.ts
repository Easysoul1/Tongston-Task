import mongoose, { Schema, model, Document } from 'mongoose';

export interface IIdempotencyKey extends Document {
  key: string;
  requestHash: string;
  status: 'in_progress' | 'succeeded' | 'failed';
  response?: unknown;
  createdAt: Date;
  updatedAt: Date;
}

const idempotencyKeySchema = new Schema({
  key: { type: String, required: true },
  requestHash: { type: String, required: true },
  status: { type: String, required: true, enum: ['in_progress', 'succeeded', 'failed'], default: 'in_progress' },
  response: { type: Schema.Types.Mixed },
}, { timestamps: true });

idempotencyKeySchema.index({ key: 1 }, { unique: true });
// TTL index: retention must outlive the longest retry path (dead-letter replay etc.)
idempotencyKeySchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 7 }); // 7 days

export const IdempotencyKey = model<IIdempotencyKey>('IdempotencyKey', idempotencyKeySchema);