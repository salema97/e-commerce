import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  DistributedCircuitBreaker,
  setDistributedCircuitBreakerRedis,
} from './distributed-circuit-breaker.js';

describe('DistributedCircuitBreaker', () => {
  beforeEach(() => {
    setDistributedCircuitBreakerRedis(null);
  });

  it('uses local breaker when Redis is not configured', async () => {
    const breaker = new DistributedCircuitBreaker({
      name: 'local-only',
      failureThreshold: 2,
      resetTimeoutMs: 60_000,
    });

    await expect(
      breaker.execute(async () => {
        throw new Error('fail');
      }),
    ).rejects.toThrow('fail');
  });

  it('opens across calls when Redis tracks failures', async () => {
    const store = new Map<string, string>();
    const redis = {
      get: vi.fn(async (key: string) => store.get(key) ?? null),
      set: vi.fn(async (key: string, value: string) => {
        store.set(key, value);
        return 'OK';
      }),
      incr: vi.fn(async (key: string) => {
        const next = Number(store.get(key) ?? '0') + 1;
        store.set(key, String(next));
        return next;
      }),
      pexpire: vi.fn(async () => 1),
      del: vi.fn(async (...keys: string[]) => {
        for (const key of keys) store.delete(key);
        return keys.length;
      }),
    };

    setDistributedCircuitBreakerRedis(redis as never);

    const breaker = new DistributedCircuitBreaker({
      name: 'redis-shared',
      failureThreshold: 2,
      resetTimeoutMs: 60_000,
    });

    const failing = vi.fn(async () => {
      throw new Error('upstream down');
    });

    await expect(breaker.execute(failing)).rejects.toThrow('upstream down');
    await expect(breaker.execute(failing)).rejects.toThrow('upstream down');
    await expect(breaker.execute(failing)).rejects.toThrow(/Circuit breaker open/);
  });
});
