import mongoose from 'mongoose';
import { env } from './env.js';
import { logger } from './logger.js';

export async function connectDB(): Promise<void> {
  const isLocalStandalone =
    env.mongoUri.includes('localhost') ||
    env.mongoUri.includes('127.0.0.1') ||
    env.mongoUri.includes('0.0.0.0');

  const hasReplicaSet = /replicaSet=([^&]+)/.test(env.mongoUri);

  if (isLocalStandalone && !hasReplicaSet && !process.env.MONGO_TRANSACTION_WARNING_SUPPRESSED) {
    logger.warn(
      'WARNING: Transactions will fail on standalone local MongoDB. Use Atlas M0 (replica set) or configure rs.initiate(). See Fix 1 in master plan.'
    );
  }

  await mongoose.connect(env.mongoUri);
  logger.info('Connected to MongoDB');
}

export async function disconnectDB(): Promise<void> {
  await mongoose.disconnect();
  logger.info('Disconnected from MongoDB');
}
