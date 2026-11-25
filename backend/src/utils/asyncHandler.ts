import { NextFunction, Request, Response } from 'express';
import { AppError } from '../utils/errors.js';

export type AsyncHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<void | unknown>;

export function asyncHandler(fn: AsyncHandler): (req: Request, res: Response, next: NextFunction) => void {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}