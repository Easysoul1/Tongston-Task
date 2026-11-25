import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller.js';
import { generalLimiter } from '../middleware/rateLimit.js';
import { validate } from '../middleware/validate.js';
import { loginBodySchema, registerBodySchema } from '../schemas/common.schema.js';

const router = Router();

router.post('/register', generalLimiter, validate(registerBodySchema), AuthController.register);
router.post('/login', generalLimiter, validate(loginBodySchema), AuthController.login);

export default router;
