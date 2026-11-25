import { z } from 'zod';
import mongoose from 'mongoose';

export const objectIdSchema = z
  .string()
  .refine(
    (val) => mongoose.Types.ObjectId.isValid(val),
    { message: 'Invalid MongoDB ObjectId format' }
  );

export const idParamSchema = z.object({
  id: objectIdSchema,
});

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export const createContentSchema = z.object({
  title: z.string().min(1).max(200),
  body: z.string().min(1).max(10000),
  tags: z.array(z.string()).optional(),
});

export const listContentQuerySchema = paginationQuerySchema.extend({
  tag: z.string().optional(),
  q: z.string().optional(),
});

export const aiSummarizeBodySchema = z.object({
  tone: z.enum(['professional', 'casual', 'funny']),
  length: z.enum(['short', 'medium', 'long']),
  promptVersion: z.string().optional(),
});

export const convertBodySchema = z.object({
  toAsset: z.enum(['MOCK_USDT', 'MOCK_ETH']),
  amount: z.number().positive(),
});

export const withdrawBodySchema = z.object({
  amount: z.number().positive(),
  destination: z.string().trim().min(1, 'Destination address is required'),
});

export const registerBodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const loginBodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});
