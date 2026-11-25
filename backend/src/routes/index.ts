import { Router } from 'express';
import authRoutes from './auth.routes.js';
import contentRoutes from './content.routes.js';
import { aiContentRouter, aiRunsRouter } from './ai.routes.js';
import tokenRoutes from './token.routes.js';
import mediaRoutes from './media.routes.js';
import { success } from '../utils/response.js';

const router = Router();

router.get('/health', (_req, res) => success(res, { status: 'ok', timestamp: new Date().toISOString() }));

router.use('/auth', authRoutes);
router.use('/content', contentRoutes);
router.use('/content', aiContentRouter);
router.use('/ai', aiRunsRouter);
router.use('/tokens', tokenRoutes);
router.use('/media', mediaRoutes);

export default router;