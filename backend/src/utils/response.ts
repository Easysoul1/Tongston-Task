import { Response } from 'express';

export function success<T>(res: Response, data?: T, status = 200): void {
  res.status(status).json({ success: true, data });
}

export function successCreated<T>(res: Response, data: T): void {
  success(res, data, 201);
}

export function noContent(res: Response): void {
  res.status(204).end();
}