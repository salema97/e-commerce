import { describe, it, expect, vi } from 'vitest';
import { getCircuitBreaker, resilientFetch } from './resilient-fetch.js';

describe('resilientFetch', () => {
  it('reuses circuit breaker instances by name', () => {
    expect(getCircuitBreaker('test-a')).toBe(getCircuitBreaker('test-a'));
  });

  it('wraps fetch with circuit breaker', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response('ok', { status: 200 })),
    );

    const response = await resilientFetch('test-b', 'https://example.com');
    expect(response.status).toBe(200);
  });
});
