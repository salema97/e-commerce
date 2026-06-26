export type CircuitBreakerState = 'closed' | 'open' | 'half_open';

export type CircuitBreakerOptions = {
  failureThreshold: number;
  resetTimeoutMs: number;
  name?: string;
};

/**
 * Minimal in-process circuit breaker for external HTTP calls.
 * Opens after consecutive failures; half-open after reset timeout.
 */
export class CircuitBreaker {
  private state: CircuitBreakerState = 'closed';
  private consecutiveFailures = 0;
  private openedAt = 0;

  constructor(private readonly options: CircuitBreakerOptions) {}

  get currentState(): CircuitBreakerState {
    if (this.state === 'open' && Date.now() - this.openedAt >= this.options.resetTimeoutMs) {
      this.state = 'half_open';
    }
    return this.state;
  }

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    const state = this.currentState;
    if (state === 'open') {
      throw new Error(
        `Circuit breaker open${this.options.name ? ` (${this.options.name})` : ''}`,
      );
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    this.consecutiveFailures = 0;
    this.state = 'closed';
  }

  private onFailure(): void {
    this.consecutiveFailures += 1;
    if (this.consecutiveFailures >= this.options.failureThreshold) {
      this.state = 'open';
      this.openedAt = Date.now();
    }
  }
}
