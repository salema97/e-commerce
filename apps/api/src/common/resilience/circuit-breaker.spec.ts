import { describe, it, expect, vi } from 'vitest';
import { CircuitBreaker } from './circuit-breaker.js';

describe('CircuitBreaker', () => {
  it('opens after consecutive failures', async () => {
    const breaker = new CircuitBreaker({ failureThreshold: 2, resetTimeoutMs: 60_000, name: 'test' });
    const failing = vi.fn(async () => {
      throw new Error('fail');
    });

    await expect(breaker.execute(failing)).rejects.toThrow('fail');
    await expect(breaker.execute(failing)).rejects.toThrow('fail');
    await expect(breaker.execute(failing)).rejects.toThrow(/Circuit breaker open/);
  });

  it('resets after a successful call', async () => {
    const breaker = new CircuitBreaker({ failureThreshold: 2, resetTimeoutMs: 60_000 });
    const ok = vi.fn(async () => 'ok');

    expect(await breaker.execute(ok)).toBe('ok');
    expect(breaker.currentState).toBe('closed');
  });
});
