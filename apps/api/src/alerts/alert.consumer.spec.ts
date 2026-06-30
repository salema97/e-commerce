import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Test } from '@nestjs/testing';
import { AlertConsumer } from './alert.consumer.js';
import { EventBus } from '../event-bus/event-bus.interface.js';
import { ErrorTracker } from '../analytics/error-tracker.interface.js';
import { ALERT_EVENT_NAMES } from '@repo/shared-types';

describe('AlertConsumer', () => {
  let consumer: AlertConsumer;
  let eventBus: { registerHandler: ReturnType<typeof vi.fn> };
  let errorTracker: { captureMessage: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    eventBus = { registerHandler: vi.fn() };
    errorTracker = { captureMessage: vi.fn() };

    const module = await Test.createTestingModule({
      providers: [
        AlertConsumer,
        { provide: EventBus, useValue: eventBus },
        { provide: ErrorTracker, useValue: errorTracker },
      ],
    }).compile();

    consumer = module.get(AlertConsumer);
  });

  it('registers an event bus handler on init', () => {
    consumer.onModuleInit();
    expect(eventBus.registerHandler).toHaveBeenCalledWith(expect.any(Function));
  });

  it.each([
    ALERT_EVENT_NAMES.SRI_DLQ,
    ALERT_EVENT_NAMES.WEBHOOK_FAILURE,
    ALERT_EVENT_NAMES.FIVE_XX_SPIKE,
  ])('logs and tracks %s alert events', async (name) => {
    consumer.onModuleInit();
    const handler = eventBus.registerHandler.mock.calls[0][0] as (event: unknown) => Promise<void>;

    await handler({
      name,
      payload: { reason: 'test' },
      occurredAt: new Date().toISOString(),
    });

    expect(errorTracker.captureMessage).toHaveBeenCalledWith(
      `Alert: ${name}`,
      expect.objectContaining({ level: 'error' }),
    );
  });

  it('ignores non-alert domain events', async () => {
    consumer.onModuleInit();
    const handler = eventBus.registerHandler.mock.calls[0][0] as (event: unknown) => Promise<void>;

    await handler({
      name: 'order.paid',
      payload: { orderId: 'order_1' },
      occurredAt: new Date().toISOString(),
    });

    expect(errorTracker.captureMessage).not.toHaveBeenCalled();
  });
});
