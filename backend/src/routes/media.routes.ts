import { Router } from 'express';
import multer from 'multer';
import { MediaController } from '../controllers/media.controller.js';
import { authenticate } from '../middleware/authenticate.js';
import { generalLimiter } from '../middleware/rateLimit.js';
import { validateObjectIdParam } from '../middleware/validate.js';
import { AppError } from '../utils/errors.js';

const ALLOWED_MIME_TYPES = ['image/', 'audio/', 'video/', 'application/pdf'];
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE_BYTES, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIME_TYPES.some((prefix) => file.mimetype.startsWith(prefix))) {
      cb(AppError.badRequest(`Unsupported file type: ${file.mimetype}. Allowed: images, audio, video, PDF.`));
      return;
    }
    cb(null, true);
  },
});

const router = Router();

router.post(
  '/upload',
  authenticate,
  generalLimiter,
  upload.single('file'),
  MediaController.upload
);

router.post(
  '/:id/promote',
  authenticate,
  generalLimiter,
  validateObjectIdParam(),
  MediaController.promote
);

export default router;
