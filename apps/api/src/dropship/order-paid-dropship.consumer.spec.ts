import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { DomainEventHandler } from '@repo/shared-types';
import { OrderPaidDropshipConsumer } from './dropship.service.js';
import type { EventBus } from '../event-bus/event-bus.interface.js';

describe('OrderPaidDropshipConsumer', () => {
  let handler: DomainEventHandler;
  let dropshipService: { splitOrderBySupplier: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    dropshipService = { splitOrderBySupplier: vi.fn() };

    const eventBus: Pick<EventBus, 'registerHandler'> = {
      registerHandler: (registered) => {
        handler = registered;
      },
    };

    const consumer = new OrderPaidDropshipConsumer(eventBus as EventBus, dropshipService as never);
    consumer.onModuleInit();
  });

  it('ignores non order.paid events', async () => {
    await handler({ name: 'product.updated', payload: { productId: 'p1' } });
    expect(dropshipService.splitOrderBySupplier).not.toHaveBeenCalled();
  });

  it('splits dropship items by supplier', async () => {
    await handler({ name: 'order.paid', payload: { orderId: 'o1' } });
    expect(dropshipService.splitOrderBySupplier).toHaveBeenCalledWith('o1');
  });
});
