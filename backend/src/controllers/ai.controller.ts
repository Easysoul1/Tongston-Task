import { Request, Response } from 'express';
import { Types } from 'mongoose';
import { AppError } from '../utils/errors.js';
import { AIRun } from '../models/ai_run.model.js';
import { User } from '../models/user.model.js';
import { AIService } from '../services/ai/ai.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { success } from '../utils/response.js';
import { z } from 'zod';
import { aiSummarizeBodySchema, paginationQuerySchema } from '../schemas/common.schema.js';

type SummarizeInput = z.infer<typeof aiSummarizeBodySchema>;
type PaginationQuery = z.infer<typeof paginationQuerySchema>;

export const AIController = {
  listRuns: asyncHandler(async (req: Request, res: Response) => {
    const user = req.user;
    if (!user) throw AppError.unauthorized();

    const { page, limit } = req.query as unknown as PaginationQuery;

    const filter = { userId: new Types.ObjectId(user.id) };
    const [data, total] = await Promise.all([
      AIRun.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      AIRun.countDocuments(filter),
    ]);

    const runs = data.map((run) => ({
      id: run._id.toString(),
      contentId: run.contentId.toString(),
      userId: run.userId.toString(),
      promptVersion: run.promptVersion,
      tone: run.tone,
      length: run.length,
      status: run.status,
      output: run.output,
      latencyMs: run.latencyMs,
      tokensAwarded: run.tokensAwarded,
      errorMessage: run.errorMessage,
      createdAt: run.createdAt,
    }));

    return success(res, { data: runs, pagination: { page, pageSize: limit, totalItems: total, totalPages: Math.ceil(total / limit) } });
  }),

  summarize: asyncHandler(async (req: Request, res: Response) => {
    const { id: contentId } = req.params;
    const { tone, length, promptVersion } = req.body as SummarizeInput;

    const user = req.user;
    if (!user) throw AppError.unauthorized();

    const aiService = new AIService();
    const result = await aiService.summarize(contentId, user.id, tone, length, promptVersion);

    const userBalance = await User.findById(user.id).then((u) => (u ? u.tokenBalance : 0));

    return res.status(201).json({
      success: true,
      data: { ...result, totalTokenBalance: userBalance },
    });
  }),
};
