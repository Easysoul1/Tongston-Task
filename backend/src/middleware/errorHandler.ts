import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import mongoose from 'mongoose';
import { AppError } from '../utils/errors.js';

export function notFoundHandler(_req: Request, res: Response) {
  return res.status(404).json({
    success: false,
    error: { code: 'NOT_FOUND', message: 'Route not found' },
  });
}

export function errorHandler(error: Error, _req: Request, res: Response, _next: NextFunction): void {
  if (error instanceof ZodError) {
    res.status(422).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'Validation failed', details: error.flatten().fieldErrors },
    });
    return;
  }

  if (error instanceof mongoose.Error.CastError || error.name === 'BSONError') {
    res.status(400).json({
      success: false,
      error: { code: 'INVALID_ID', message: 'Malformed identifier in request path' },
    });
    return;
  }

  if (error.name === 'MulterError') {
    const statusCode = (error as any).code === 'LIMIT_FILE_SIZE' ? 413 : 400;
    res.status(statusCode).json({
      success: false,
      error: { code: 'UPLOAD_ERROR', message: error.message },
    });
    return;
  }

  const appError = error as any;
  const statusCode =
    appError.statusCode !== undefined && appError.statusCode >= 400
      ? appError.statusCode
      : appError.status >= 400
        ? appError.status
        : 500;
  const isKnownError = error instanceof AppError;
  const exposeMessage = isKnownError || statusCode < 500;
  const code = isKnownError ? appError.code : statusCode === 429 ? 'RATE_LIMITED' : statusCode < 500 ? 'BAD_REQUEST' : 'INTERNAL_ERROR';
  const message = exposeMessage ? appError.message : 'Internal server error';

  res.status(statusCode).json({
    success: false,
    error: { code, message, ...(statusCode < 500 ? { details: appError.details } : {}) },
  });
}

export function rateLimitErrorHandler(error: Error, _req: Request, res: Response, _next: NextFunction): void {
  const statusCode = (error as any).statusCode === 429 || (error as any).status === 429 ? 429 : 500;
  if (statusCode === 429) {
    res.status(429).json({
      success: false,
      error: { code: 'RATE_LIMITED', message: 'Too many requests. Please try again later.' },
    });
    return;
  }
  res.status(500).json({
    success: false,
    error: { code: 'INTERNAL_ERROR', message: 'Internal server error' },
  });
}