import { describe, it, expect, beforeEach, vi } from 'vitest';
import { HttpAdapterHost, HttpStatus } from '@nestjs/common';
import { AllExceptionsFilter } from './http-exception.filter.js';
import { ErrorTracker } from '../../analytics/error-tracker.interface.js';
import { EventBus } from '../../event-bus/event-bus.interface.js';

describe('AllExceptionsFilter', () => {
  let filter: AllExceptionsFilter;
  let errorTracker: { captureException: ReturnType<typeof vi.fn>; captureMessage: ReturnType<typeof vi.fn> };
  let eventBus: { publish: ReturnType<typeof vi.fn> };
  let httpAdapter: { reply: ReturnType<typeof vi.fn>; getRequestUrl: ReturnType<typeof vi.fn> };
  let host: { switchToHttp: () => { getRequest: () => object; getResponse: () => object } };

  beforeEach(() => {
    errorTracker = {
      captureException: vi.fn(),
      captureMessage: vi.fn(),
    };
    eventBus = { publish: vi.fn() };
    httpAdapter = {
      reply: vi.fn(),
      getRequestUrl: vi.fn().mockReturnValue('/v1/test'),
    };

    const adapterHost = { httpAdapter } as unknown as HttpAdapterHost;
    filter = new AllExceptionsFilter(adapterHost, errorTracker, eventBus as unknown as EventBus);

    host = {
      switchToHttp: () => ({
        getRequest: () => ({}),
        getResponse: () => ({}),
      }),
    };
  });

  it('emits alert.5xx_spike after threshold is reached', () => {
    const error = new Error('Boom');

    for (let i = 0; i < 10; i += 1) {
      filter.catch(error, host as never);
    }

    expect(errorTracker.captureMessage).toHaveBeenCalledWith(
      expect.stringContaining('5xx spike detected'),
      expect.objectContaining({ level: 'warning' }),
    );
    expect(eventBus.publish).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'alert.5xx_spike' }),
    );
    expect(httpAdapter.reply).toHaveBeenCalledTimes(10);
  });

  it('does not emit spike alert below threshold', () => {
    const error = new Error('Boom');

    for (let i = 0; i < 9; i += 1) {
      filter.catch(error, host as never);
    }

    expect(errorTracker.captureMessage).not.toHaveBeenCalled();
    expect(eventBus.publish).not.toHaveBeenCalled();
  });

  it('resets counter after window expires', () => {
    vi.useFakeTimers();
    const error = new Error('Boom');

    for (let i = 0; i < 10; i += 1) {
      filter.catch(error, host as never);
    }

    expect(eventBus.publish).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(61_000);

    for (let i = 0; i < 10; i += 1) {
      filter.catch(error, host as never);
    }

    expect(eventBus.publish).toHaveBeenCalledTimes(2);
    vi.useRealTimers();
  });
});
