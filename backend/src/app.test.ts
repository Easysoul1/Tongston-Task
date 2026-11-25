import type { Server } from 'http';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { createApp } from './app.js';

describe('HTTP contract', () => {
  let server: Server;
  let baseUrl: string;

  beforeAll(async () => {
    const app = createApp();
    await new Promise<void>((resolve) => {
      server = app.listen(0, () => resolve());
    });
    const address = server.address();
    const port = typeof address === 'object' && address ? address.port : 0;
    baseUrl = `http://127.0.0.1:${port}`;
  });

  afterAll(async () => {
    await new Promise<void>((resolve) => {
      server.close(() => resolve());
      server.closeAllConnections();
    });
  });

  const request = async (
    method: string,
    path: string,
    options: { body?: unknown; auth?: boolean; token?: string } = {}
  ) => {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (options.token) {
      headers.Authorization = `Bearer ${options.token}`;
    } else if (options.auth) {
      headers.Authorization = `Bearer ${jwt.sign({ id: new mongoose.Types.ObjectId().toString(), role: 'USER' }, process.env.JWT_SECRET as string, { expiresIn: '1h' })}`;
    }

    const res = await fetch(`${baseUrl}${path}`, {
      method,
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
    });

    return { status: res.status, body: (await res.json().catch(() => null)) as any };
  };

  test('returns 401 without a token instead of crashing the process', async () => {
    const res = await request('GET', '/api/v1/content/507f1f77bcf86cd799439011');
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  test('returns 401 for an invalid token', async () => {
    const res = await request('GET', '/api/v1/content/507f1f77bcf86cd799439011', { token: 'not-a-jwt' });
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  test('returns 400 for a malformed id in the path', async () => {
    const res = await request('GET', '/api/v1/content/not-an-object-id', { auth: true });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('BAD_REQUEST');
  });

  test('returns 422 for an invalid request body', async () => {
    const res = await request('POST', '/api/v1/auth/register', { body: { email: 'not-an-email', password: 'secret1' } });
    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  test('returns 422 for an invalid query parameter', async () => {
    const res = await request('GET', '/api/v1/tokens/history?page=not-a-number', { auth: true });
    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  test('returns 404 for an unknown route', async () => {
    const res = await request('GET', '/api/v1/does-not-exist', { auth: true });
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  test('returns 200 for the health check', async () => {
    const res = await request('GET', '/api/v1/health');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
