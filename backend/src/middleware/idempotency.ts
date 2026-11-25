import { Request, Response, NextFunction } from 'express';
import { IdempotencyService, hashRequest } from '../services/idempotency.service.js';
import { IdempotencyKey } from '../models/idempotency_key.model.js';
import { AppError } from '../utils/errors.js';

const service = new IdempotencyService();

export function idempotency(req: Request, res: Response, next: NextFunction): void {
  const key = req.headers['idempotency-key'] as string | undefined;
  if (!key) {
    next();
    return;
  }

  const requestHash = hashRequest(req.body);

  void (async () => {
    try {
      const claim = await service.claim(key, requestHash);
      if (!claim) {
        next();
        return;
      }
    } catch (err: unknown) {
      const appError = err as AppError;
      if (appError instanceof AppError && appError.code === 'CONFLICT') {
        const stored = await IdempotencyKey.findOne({ key });
        if (stored && stored.status === 'succeeded' && stored.requestHash === requestHash) {
          res.status(200).json(stored.response ?? { success: true });
          return;
        }
      }
      next(err);
      return;
    }

    const originalJson = res.json.bind(res);
    res.json = (body: unknown) => {
      const status = res.statusCode;
      service
        .complete(key, status >= 200 && status < 300 ? 'succeeded' : 'failed', body)
        .catch(() => {});
      return originalJson(body);
    };

    next();
  })();
}
