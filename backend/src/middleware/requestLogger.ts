import { Request, Response, NextFunction } from 'express';
import { logger } from '../config/logger.js';

export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now();
  const reqId = (req.headers['x-request-id'] as string) || crypto.randomUUID();

  (req as any).reqId = reqId;

  res.setHeader('X-Request-ID', reqId);

  res.on('finish', () => {
    const latency = Date.now() - start;
    logger.info({
      reqId,
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      latencyMs: latency,
      userId: (req as any).user?.id,
    });
  });

  next();
}