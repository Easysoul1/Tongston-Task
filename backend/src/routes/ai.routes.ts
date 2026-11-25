import { Router } from 'express';
import { AIController } from '../controllers/ai.controller.js';
import { authenticate } from '../middleware/authenticate.js';
import { generalLimiter, aiRateLimiter } from '../middleware/rateLimit.js';
import { validate, validateQuery, validateObjectIdParam } from '../middleware/validate.js';
import { aiSummarizeBodySchema, paginationQuerySchema } from '../schemas/common.schema.js';

export const aiContentRouter = Router();
export const aiRunsRouter = Router();

aiContentRouter.post(
  '/:id/ai/summarize',
  authenticate,
  aiRateLimiter,
  validateObjectIdParam(),
  validate(aiSummarizeBodySchema),
  AIController.summarize
);

aiRunsRouter.get('/runs', authenticate, generalLimiter, validateQuery(paginationQuerySchema), AIController.listRuns);
