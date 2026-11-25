import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import mongoose from 'mongoose';
import { AppError } from '../utils/errors.js';

export function validate(schema: z.ZodTypeAny) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      throw AppError.validation('Invalid request body', {
        errors: result.error.flatten().fieldErrors,
      });
    }
    req.body = result.data;
    next();
  };
}

export function validateQuery(schema: z.ZodTypeAny) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      throw AppError.validation('Invalid query parameters', {
        errors: result.error.flatten().fieldErrors,
      });
    }
    (req as any).query = result.data;
    next();
  };
}

export function validateObjectIdParam(param = 'id') {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const value = req.params[param];
    if (!value || !mongoose.Types.ObjectId.isValid(value)) {
      throw AppError.badRequest(`Invalid ${param} parameter`);
    }
    next();
  };
}
