import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { AppError } from '../utils/errors.js';
import { User } from '../models/user.model.js';

export interface AuthRequest extends Request {
  user?: { id: string; role: 'ADMIN' | 'USER' };
}

export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers['authorization'];
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined;

  if (!token) {
    next(AppError.unauthorized('No token provided'));
    return;
  }

  try {
    const decoded = jwt.verify(token, env.jwtSecret) as { id: string; role: 'ADMIN' | 'USER' };
    (req as AuthRequest).user = decoded;
    next();
  } catch {
    next(AppError.unauthorized('Invalid or expired token'));
  }
}

export function authorize(...allowedRoles: string[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const user = (req as AuthRequest).user;
    if (!user) {
      throw AppError.unauthorized();
    }
    if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
      throw AppError.forbidden('Insufficient permissions');
    }
    next();
  };
}

export function signToken(user: { id: string; role: 'ADMIN' | 'USER' }): string {
  return jwt.sign(user, env.jwtSecret, { expiresIn: '24h' });
}