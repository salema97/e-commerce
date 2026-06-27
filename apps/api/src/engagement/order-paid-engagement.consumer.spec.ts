import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { DomainEvent, DomainEventHandler } from '@repo/shared-types';
import { OrderPaidEngagementConsumer } from './order-paid-engagement.consumer.js';
import type { EventBus } from '../event-bus/event-bus.interface.js';

describe('OrderPaidEngagementConsumer', () => {
  let handler: DomainEventHandler;
  let loyaltyService: { earnForPurchase: ReturnType<typeof vi.fn> };
  let referralsService: { recordConversion: ReturnType<typeof vi.fn> };
  let prisma: { order: { findUnique: ReturnType<typeof vi.fn> } };

  beforeEach(() => {
    loyaltyService = { earnForPurchase: vi.fn() };
    referralsService = { recordConversion: vi.fn() };
    prisma = { order: { findUnique: vi.fn() } };

    const eventBus: Pick<EventBus, 'registerHandler'> = {
      registerHandler: (registered) => {
        handler = registered;
      },
    };

    const consumer = new OrderPaidEngagementConsumer(
      eventBus as EventBus,
      prisma as never,
      loyaltyService as never,
      referralsService as never,
    );
    consumer.onModuleInit();
  });

  it('ignores non order.paid events', async () => {
    await handler({ name: 'order.shipped', payload: { orderId: 'o1' } });
    expect(prisma.order.findUnique).not.toHaveBeenCalled();
  });

  it('earns loyalty points for authenticated customers', async () => {
    prisma.order.findUnique.mockResolvedValue({
      id: 'o1',
      userId: 'u1',
      total: 120,
      referralCode: null,
    });

    await handler({ name: 'order.paid', payload: { orderId: 'o1' } });

    expect(loyaltyService.earnForPurchase).toHaveBeenCalledWith('u1', 'o1', 120);
    expect(referralsService.recordConversion).not.toHaveBeenCalled();
  });

  it('records referral conversion when referral code is present', async () => {
    prisma.order.findUnique.mockResolvedValue({
      id: 'o1',
      userId: 'u1',
      total: 80,
      referralCode: 'REF10',
    });

    await handler({ name: 'order.paid', payload: { orderId: 'o1' } });

    expect(referralsService.recordConversion).toHaveBeenCalledWith('o1', 'REF10', 'u1');
  });
});
