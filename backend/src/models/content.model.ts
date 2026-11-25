import mongoose, { Schema, model, Document } from 'mongoose';

export interface IContentItem extends Document {
  title: string;
  body: string;
  tags: string[];
  createdBy: mongoose.Types.ObjectId;
  mediaAssets: mongoose.Types.ObjectId[];
  createdAt: Date;
}

const contentSchema = new Schema({
  title: { type: String, required: true },
  body: { type: String, required: true },
  tags: [{ type: String }],
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  mediaAssets: [{ type: Schema.Types.ObjectId, ref: 'MediaAsset' }],
}, { timestamps: true });

contentSchema.index({ tags: 1 });
contentSchema.index({ createdBy: 1 });
contentSchema.index({ title: 'text', body: 'text' });

export const ContentItem = model<IContentItem>('ContentItem', contentSchema);