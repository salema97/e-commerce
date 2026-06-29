import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RedisIdempotencyService } from './idempotency.service.js';
import { RedisService } from './redis.service.js';

describe('RedisIdempotencyService', () => {
  let service: RedisIdempotencyService;
  let redisClient: { set: ReturnType<typeof vi.fn>; del: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    redisClient = {
      set: vi.fn(),
      del: vi.fn(),
    };
    const redisService = { client: redisClient } as unknown as RedisService;
    service = new RedisIdempotencyService(redisService);
  });

  it('claims a key when Redis returns OK', async () => {
    redisClient.set.mockResolvedValue('OK');

    const result = await service.claim('order:123', 60);

    expect(result).toBe(true);
    expect(redisClient.set).toHaveBeenCalledWith(
      'idempotency:order:123',
      '1',
      'EX',
      60,
      'NX',
    );
  });

  it('returns false when the key already exists', async () => {
    redisClient.set.mockResolvedValue(null);

    const result = await service.claim('order:123', 60);

    expect(result).toBe(false);
  });

  it('returns false (fail-closed) when Redis throws', async () => {
    redisClient.set.mockRejectedValue(new Error('Redis unavailable'));

    const result = await service.claim('order:123', 60);

    expect(result).toBe(false);
  });

  it('releases a key', async () => {
    redisClient.del.mockResolvedValue(1);

    await service.release('order:123');

    expect(redisClient.del).toHaveBeenCalledWith('idempotency:order:123');
  });
});
