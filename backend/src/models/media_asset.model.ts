import mongoose, { Schema, model, Document, Types } from 'mongoose';

export interface IMediaAsset extends Document {
  originalName: string;
  createdBy: Types.ObjectId;
  cloudinaryUrl?: string;
  cloudinaryPublicId?: string;
  s3Url?: string;
  s3Key?: string;
  status: 'CLOUDINARY' | 'S3' | 'FAILED';
}

const mediaAssetSchema = new Schema({
  originalName: { type: String, required: true },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  cloudinaryUrl: { type: String },
  cloudinaryPublicId: { type: String },
  s3Url: { type: String },
  s3Key: { type: String },
  status: { type: String, required: true, enum: ['CLOUDINARY', 'S3', 'FAILED'], default: 'CLOUDINARY' },
}, { timestamps: true });

export const MediaAsset = model<IMediaAsset>('MediaAsset', mediaAssetSchema);