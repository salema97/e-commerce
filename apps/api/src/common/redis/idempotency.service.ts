import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from './redis.service.js';

/**
 * Redis-backed idempotency helper for webhooks and other at-least-once
 * delivery pipelines.
 */
@Injectable()
export class RedisIdempotencyService {
  private readonly logger = new Logger(RedisIdempotencyService.name);
  private readonly keyPrefix = 'idempotency:';

  constructor(private readonly redis: RedisService) {}

  /**
   * Attempts to mark an idempotency key as processed.
   *
   * @returns `true` if this is the first time the key is seen;
   *          `false` if it already exists (duplicate).
   */
  async claim(key: string, ttlSeconds = 86_400): Promise<boolean> {
    const fullKey = `${this.keyPrefix}${key}`;

    try {
      const result = await this.redis.client.set(fullKey, '1', 'EX', ttlSeconds, 'NX');
      return result === 'OK';
    } catch (error) {
      this.logger.error(
        { error, key },
        'Redis idempotency check failed; rejecting claim to avoid duplicate webhook processing',
      );
      return false;
    }
  }

  /**
   * Releases an idempotency key so a failed delivery can be retried.
   */
  async release(key: string): Promise<void> {
    const fullKey = `${this.keyPrefix}${key}`;

    try {
      await this.redis.client.del(fullKey);
    } catch (error) {
      this.logger.warn({ error, key }, 'Failed to release idempotency key');
    }
  }
}
