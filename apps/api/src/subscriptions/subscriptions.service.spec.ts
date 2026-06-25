import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SubscriptionsService } from './subscriptions.service.js';

describe('SubscriptionsService', () => {
  let service: SubscriptionsService;
  let prisma: {
    product: { findUnique: ReturnType<typeof vi.fn>; update: ReturnType<typeof vi.fn> };
    $transaction: ReturnType<typeof vi.fn>;
    subscriptionPlan: { create: ReturnType<typeof vi.fn> };
  };

  beforeEach(() => {
    prisma = {
      product: { findUnique: vi.fn().mockResolvedValue({ id: 'p1' }), update: vi.fn() },
      $transaction: vi.fn(async (cb) =>
        cb({
          product: { update: vi.fn() },
          subscriptionPlan: { create: vi.fn().mockResolvedValue({ id: 'plan1' }) },
        }),
      ),
      subscriptionPlan: { create: vi.fn().mockResolvedValue({ id: 'plan1' }) },
    };
    service = new SubscriptionsService(
      prisma as never,
      { createOrUpdateCustomer: vi.fn() } as never,
      { isConfigured: () => true, createSubscriptionCheckout: vi.fn() } as never,
    );
  });

  it('creates subscription plan and marks product as subscription', async () => {
    const plan = await service.createPlan({ productId: 'p1', stripePriceId: 'price_1' });
    expect(plan.id).toBe('plan1');
    expect(prisma.product.findUnique).toHaveBeenCalledWith({ where: { id: 'p1' } });
  });
});
