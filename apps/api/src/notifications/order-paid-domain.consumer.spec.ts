import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { DomainEventHandler } from '@repo/shared-types';
import { OrderPaidDomainConsumer } from './order-paid-domain.consumer.js';
import type { EventBus } from '../event-bus/event-bus.interface.js';

describe('OrderPaidDomainConsumer', () => {
  let handler: DomainEventHandler;
  let orderConfirmation: { sendPaidOrderNotifications: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    orderConfirmation = { sendPaidOrderNotifications: vi.fn() };

    const eventBus: Pick<EventBus, 'registerHandler'> = {
      registerHandler: (registered) => {
        handler = registered;
      },
    };

    const consumer = new OrderPaidDomainConsumer(eventBus as EventBus, orderConfirmation as never);
    consumer.onModuleInit();
  });

  it('skips events without orderId', async () => {
    await handler({ name: 'order.paid', payload: {} });
    expect(orderConfirmation.sendPaidOrderNotifications).not.toHaveBeenCalled();
  });

  it('sends paid-order notifications', async () => {
    await handler({ name: 'order.paid', payload: { orderId: 'o1' } });
    expect(orderConfirmation.sendPaidOrderNotifications).toHaveBeenCalledWith('o1');
  });
});
