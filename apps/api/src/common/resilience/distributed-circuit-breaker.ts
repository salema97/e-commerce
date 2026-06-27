import type { Redis } from 'ioredis';
import { CircuitBreaker, type CircuitBreakerState } from './circuit-breaker.js';

export type DistributedCircuitBreakerOptions = {
  name: string;
  failureThreshold?: number;
  resetTimeoutMs?: number;
};

let sharedRedis: Redis | null = null;

/** Called from RedisModule bootstrap so HTTP clients share breaker state across replicas. */
export function setDistributedCircuitBreakerRedis(client: Redis | null): void {
  sharedRedis = client;
}

export function getDistributedCircuitBreakerRedis(): Redis | null {
  return sharedRedis;
}

/**
 * Circuit breaker with optional Redis-backed state for multi-instance deployments.
 * Falls back to in-process breaker when Redis is unavailable.
 */
export class DistributedCircuitBreaker {
  private readonly local: CircuitBreaker;
  private readonly failureThreshold: number;
  private readonly resetTimeoutMs: number;
  private readonly keyPrefix: string;

  constructor(options: DistributedCircuitBreakerOptions) {
    this.failureThreshold = options.failureThreshold ?? 5;
    this.resetTimeoutMs = options.resetTimeoutMs ?? 30_000;
    this.keyPrefix = `circuit:${options.name}`;
    this.local = new CircuitBreaker({
      name: options.name,
      failureThreshold: this.failureThreshold,
      resetTimeoutMs: this.resetTimeoutMs,
    });
  }

  get currentState(): CircuitBreakerState {
    return this.local.currentState;
  }

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (!sharedRedis) {
      return this.local.execute(fn);
    }

    const openUntilKey = `${this.keyPrefix}:open_until`;
    const failuresKey = `${this.keyPrefix}:failures`;

    try {
      const openUntil = await sharedRedis.get(openUntilKey);
      if (openUntil && Date.now() < Number(openUntil)) {
        throw new Error(`Circuit breaker open (${this.keyPrefix})`);
      }

      const result = await fn();
      await sharedRedis.del(failuresKey, openUntilKey);
      return result;
    } catch (error) {
      const failures = await sharedRedis.incr(failuresKey);
      if (failures === 1) {
        await sharedRedis.pexpire(failuresKey, this.resetTimeoutMs * 2);
      }

      if (failures >= this.failureThreshold) {
        await sharedRedis.set(
          openUntilKey,
          String(Date.now() + this.resetTimeoutMs),
          'PX',
          this.resetTimeoutMs,
        );
      }

      throw error;
    }
  }
}
