import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { DomainEventHandler } from '@repo/shared-types';
import { OrderPaidSellerConsumer } from './order-paid-seller.consumer.js';
import type { EventBus } from '../event-bus/event-bus.interface.js';

describe('OrderPaidSellerConsumer', () => {
  let handler: DomainEventHandler;
  let sellersService: { createPayoutsForOrder: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    sellersService = { createPayoutsForOrder: vi.fn() };

    const eventBus: Pick<EventBus, 'registerHandler'> = {
      registerHandler: (registered) => {
        handler = registered;
      },
    };

    const consumer = new OrderPaidSellerConsumer(eventBus as EventBus, sellersService as never);
    consumer.onModuleInit();
  });

  it('ignores unrelated domain events', async () => {
    await handler({ name: 'invoice.authorized', payload: { invoiceId: 'inv1' } });
    expect(sellersService.createPayoutsForOrder).not.toHaveBeenCalled();
  });

  it('creates seller payouts when order is paid', async () => {
    await handler({ name: 'order.paid', payload: { orderId: 'o1' } });
    expect(sellersService.createPayoutsForOrder).toHaveBeenCalledWith('o1');
  });
});
