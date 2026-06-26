import { CircuitBreaker } from './circuit-breaker.js';

const breakers = new Map<string, CircuitBreaker>();

export function getCircuitBreaker(name: string, options?: {
  failureThreshold?: number;
  resetTimeoutMs?: number;
}): CircuitBreaker {
  const existing = breakers.get(name);
  if (existing) {
    return existing;
  }

  const breaker = new CircuitBreaker({
    name,
    failureThreshold: options?.failureThreshold ?? 5,
    resetTimeoutMs: options?.resetTimeoutMs ?? 30_000,
  });
  breakers.set(name, breaker);
  return breaker;
}

export async function resilientFetch(
  breakerName: string,
  url: string,
  init?: RequestInit,
): Promise<Response> {
  return getCircuitBreaker(breakerName).execute(() => fetch(url, init));
}
