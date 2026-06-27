import { describe, expect, it } from 'vitest';
import { ExecutionContext } from '@nestjs/common';
import { AppThrottlerGuard } from './app-throttler.guard.js';

describe('AppThrottlerGuard', () => {
  const guard = new AppThrottlerGuard({} as never, {} as never, {} as never);

  it('tracks authenticated users by user id', async () => {
    const tracker = await guard['getTracker']({
      user: { userId: 'user-123' },
      ip: '1.2.3.4',
      headers: {},
    } as never);
    expect(tracker).toBe('user:user-123');
  });

  it('tracks API keys when present', async () => {
    const tracker = await guard['getTracker']({
      ip: '1.2.3.4',
      headers: { 'x-api-key': 'secret-key' },
    } as never);
    expect(tracker).toBe('apikey:secret-key');
  });

  it('falls back to IP for anonymous requests', async () => {
    const tracker = await guard['getTracker']({
      ip: '9.9.9.9',
      headers: {},
    } as never);
    expect(tracker).toBe('9.9.9.9');
  });

  it('skips throttling when E2E_RELAX_THROTTLE is true', async () => {
    const previous = process.env.E2E_RELAX_THROTTLE;
    process.env.E2E_RELAX_THROTTLE = 'true';
    try {
      const shouldSkip = await guard['shouldSkip']({} as ExecutionContext);
      expect(shouldSkip).toBe(true);
    } finally {
      process.env.E2E_RELAX_THROTTLE = previous;
    }
  });
});
