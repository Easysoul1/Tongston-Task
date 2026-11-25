import { Router } from 'express';
import { TokenController } from '../controllers/token.controller.js';
import { authenticate } from '../middleware/authenticate.js';
import { generalLimiter, tokenConvertRateLimiter } from '../middleware/rateLimit.js';
import { idempotency } from '../middleware/idempotency.js';
import { validate, validateQuery } from '../middleware/validate.js';
import { convertBodySchema, paginationQuerySchema, withdrawBodySchema } from '../schemas/common.schema.js';

const router = Router();

router.get('/balance', authenticate, generalLimiter, TokenController.balance);
router.get('/history', authenticate, generalLimiter, validateQuery(paginationQuerySchema), TokenController.history);
router.post('/convert', authenticate, tokenConvertRateLimiter, validate(convertBodySchema), TokenController.convert);
router.post('/withdraw', authenticate, generalLimiter, idempotency, validate(withdrawBodySchema), TokenController.withdraw);

export default router;
