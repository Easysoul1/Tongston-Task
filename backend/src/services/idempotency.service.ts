import { createHash } from 'crypto';
import { IdempotencyKey } from '../models/idempotency_key.model.js';
import { AppError } from '../utils/errors.js';

export function hashRequest(obj: unknown): string {
  return createHash('sha256').update(JSON.stringify(obj)).digest('hex');
}

export class IdempotencyService {
  // Returns the prior response on a replay with the same payload,
  // throws on payload mismatch, returns null on a fresh claim.
  async claim(key: string, requestHash: string): Promise<{ renewed: boolean } | null> {
    try {
      const record = await IdempotencyKey.create({
        key,
        requestHash,
        status: 'in_progress',
      });
      return record ? { renewed: false } : null;
    } catch (err: any) {
      if (err?.code !== 11000) throw err;
    }

    // Existing record: inspect it
    const existing = await IdempotencyKey.findOne({ key });
    if (!existing) {
      // Race: record vanished (TTL). Retry once.
      const retried = await IdempotencyKey.create({ key, requestHash, status: 'in_progress' }).catch(() => null);
      return retried ? { renewed: false } : null;
    }

    if (existing.requestHash !== requestHash) {
      throw AppError.conflict('Idempotency key reused with a different payload');
    }

    if (existing.status === 'in_progress') {
      throw AppError.conflict('A request with this idempotency key is already in progress');
    }

    if (existing.status === 'succeeded') {
      throw AppError.conflict('Idempotency replay');
    }

    // failed -> allow retry but keep the original record (renew)
    await IdempotencyKey.updateOne({ key }, { $set: { status: 'in_progress', updatedAt: new Date() } });
    return { renewed: true };
  }

  async complete(key: string, status: 'succeeded' | 'failed', response?: unknown): Promise<void> {
    await IdempotencyKey.updateOne(
      { key },
      { $set: { status, response, updatedAt: new Date() } }
    );
  }
}
