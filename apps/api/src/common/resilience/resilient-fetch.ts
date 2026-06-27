import { CircuitBreaker } from './circuit-breaker.js';
import { DistributedCircuitBreaker } from './distributed-circuit-breaker.js';

const breakers = new Map<string, DistributedCircuitBreaker>();

export function getCircuitBreaker(name: string, options?: {
  failureThreshold?: number;
  resetTimeoutMs?: number;
}): DistributedCircuitBreaker {
  const existing = breakers.get(name);
  if (existing) {
    return existing;
  }

  const breaker = new DistributedCircuitBreaker({
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

const DEFAULT_RETRY_STATUSES = new Set([408, 429, 500, 502, 503, 504]);
const DEFAULT_MAX_RETRIES = 3;

function isRetryableStatus(status: number): boolean {
  return DEFAULT_RETRY_STATUSES.has(status);
}

function backoffMs(attempt: number): number {
  return Math.min(1_000 * 2 ** attempt, 8_000);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * HTTP fetch with circuit breaker and limited retries for transient failures.
 */
export async function resilientFetchWithRetry(
  breakerName: string,
  url: string,
  init?: RequestInit,
  maxRetries = DEFAULT_MAX_RETRIES,
): Promise<Response> {
  let lastResponse: Response | undefined;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const response = await resilientFetch(breakerName, url, init);
    lastResponse = response;

    if (response.ok || !isRetryableStatus(response.status) || attempt === maxRetries - 1) {
      return response;
    }

    await sleep(backoffMs(attempt));
  }

  return lastResponse!;
}
