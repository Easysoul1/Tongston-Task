import cloudinary from 'cloudinary';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { isUsableCredential } from '../utils/credentials.js';

export interface StorageProvider {
  upload(buffer: Buffer, originalName: string, mimeType?: string): Promise<{ url: string; key: string }>;
}

export class CloudinaryStorage implements StorageProvider {
  constructor(private readonly cloudinaryConfig: { cloudName: string; apiKey: string; apiSecret: string }) {
    cloudinary.v2.config({
      cloud_name: cloudinaryConfig.cloudName,
      api_key: cloudinaryConfig.apiKey,
      api_secret: cloudinaryConfig.apiSecret,
    });
  }

  async upload(buffer: Buffer, originalName: string, mimeType = 'application/octet-stream'): Promise<{ url: string; key: string }> {
    const dataUri = `data:${mimeType};base64,${buffer.toString('base64')}`;
    const resourceType = mimeType.startsWith('video') ? 'video' : mimeType.startsWith('image') ? 'image' : 'raw';
    const result = await cloudinary.v2.uploader.upload(dataUri, { resource_type: resourceType });
    return { url: result.secure_url, key: result.public_id };
  }
}

export class S3Storage implements StorageProvider {
  constructor(
    private readonly s3Config: { accessKeyId: string; secretAccessKey: string; region: string; bucket: string }
  ) {}

  async upload(buffer: Buffer, originalName: string, _mimeType?: string): Promise<{ url: string; key: string }> {
    const s3 = new S3Client({
      credentials: {
        accessKeyId: this.s3Config.accessKeyId,
        secretAccessKey: this.s3Config.secretAccessKey,
      },
      region: this.s3Config.region,
    });
    const key = `media/${Date.now()}-${originalName}`;
    const command = new PutObjectCommand({
      Bucket: this.s3Config.bucket,
      Key: key,
      Body: buffer,
    });
    await s3.send(command);
    const url = `https://${this.s3Config.bucket}.s3.${this.s3Config.region}.amazonaws.com/${key}`;
    return { url, key };
  }
}

export class MockStorage implements StorageProvider {
  async upload(_buffer: Buffer, originalName: string, _mimeType?: string): Promise<{ url: string; key: string }> {
    const key = `mock/${Date.now()}-${originalName}`;
    return { url: `https://mock-storage.local/${key}`, key };
  }
}

export function getStorageProvider(): StorageProvider {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (isUsableCredential(cloudName) && isUsableCredential(apiKey) && isUsableCredential(apiSecret)) {
    return new CloudinaryStorage({
      cloudName: cloudName!,
      apiKey: apiKey!,
      apiSecret: apiSecret!,
    });
  }
  return new MockStorage();
}

export function getS3Provider(): StorageProvider | null {
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
  const bucket = process.env.AWS_S3_BUCKET;

  if (isUsableCredential(accessKeyId) && isUsableCredential(secretAccessKey) && isUsableCredential(bucket)) {
    return new S3Storage({
      accessKeyId: accessKeyId!,
      secretAccessKey: secretAccessKey!,
      region: process.env.AWS_REGION || 'us-east-1',
      bucket: bucket!,
    });
  }
  return null;
}
