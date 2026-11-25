import { Request, Response } from 'express';
import { Types } from 'mongoose';
import { MediaAsset } from '../models/media_asset.model.js';
import { getStorageProvider, getS3Provider, MockStorage } from '../services/storage.service.js';
import { AppError } from '../utils/errors.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { success, successCreated } from '../utils/response.js';

export const MediaController = {
  upload: asyncHandler(async (req: Request, res: Response) => {
    if (!req.file) throw AppError.badRequest('No file uploaded');

    const provider = getStorageProvider();
    const { url, key } = await provider.upload(req.file.buffer, req.file.originalname, req.file.mimetype);

    const asset = await MediaAsset.create({
      originalName: req.file.originalname,
      createdBy: new Types.ObjectId(req.user!.id),
      cloudinaryUrl: url,
      cloudinaryPublicId: key,
      status: 'CLOUDINARY',
    });

    return successCreated(res, { id: asset._id.toString(), originalName: asset.originalName, cloudinaryUrl: asset.cloudinaryUrl, status: asset.status });
  }),

  promote: asyncHandler(async (req: Request, res: Response) => {
    const asset = await MediaAsset.findById(req.params.id);
    if (!asset) throw AppError.notFound('Media asset');

    if (asset.status === 'S3') {
      return success(res, { id: asset._id.toString(), status: asset.status, s3Url: asset.s3Url, s3Key: asset.s3Key });
    }

    const s3Provider = getS3Provider();
    const mockProvider = new MockStorage();

    try {
      const { url, key } = s3Provider
        ? await s3Provider.upload(Buffer.from(''), asset.originalName)
        : await mockProvider.upload(Buffer.from(''), asset.originalName);

      asset.s3Url = url;
      asset.s3Key = key;
      asset.status = 'S3';
      await asset.save();
    } catch (err) {
      asset.status = 'FAILED';
      await asset.save();
      throw AppError.internal('Failed to promote media asset to S3');
    }

    return success(res, { id: asset._id.toString(), status: asset.status, s3Url: asset.s3Url, s3Key: asset.s3Key });
  }),
};