import { Router } from 'express';
import { ContentController } from '../controllers/content.controller.js';
import { authenticate } from '../middleware/authenticate.js';
import { generalLimiter } from '../middleware/rateLimit.js';
import { validate, validateQuery, validateObjectIdParam } from '../middleware/validate.js';
import { createContentSchema, listContentQuerySchema } from '../schemas/common.schema.js';

const router = Router();

router.post('/', authenticate, generalLimiter, validate(createContentSchema), ContentController.create);
router.get('/', authenticate, generalLimiter, validateQuery(listContentQuerySchema), ContentController.list);
router.get('/:id', authenticate, generalLimiter, validateObjectIdParam(), ContentController.get);

export default router;
