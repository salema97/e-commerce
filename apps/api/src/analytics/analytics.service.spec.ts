import { describe, expect, it, vi } from 'vitest';
import { AnalyticsService } from './analytics.service.js';
import { AnalyticsEventStore } from './analytics-event-store.interface.js';
import { ProductAnalyticsProvider } from './product-analytics-provider.interface.js';

describe('AnalyticsService', () => {
  const store: AnalyticsEventStore = {
    record: vi.fn().mockResolvedValue(undefined),
    recordDomainEvent: vi.fn().mockResolvedValue(undefined),
  };

  const productAnalytics: ProductAnalyticsProvider = {
    capture: vi.fn().mockResolvedValue(undefined),
    isFeatureEnabled: vi.fn().mockResolvedValue(false),
  };

  const prisma = {
    order: {
      findMany: vi.fn().mockResolvedValue([{ id: 'o1', total: 100 }]),
    },
    analyticsEventRecord: { count: vi.fn().mockResolvedValue(2) },
    orderItem: {
      groupBy: vi.fn().mockResolvedValue([
        { productId: 'p1', name: 'Product A', _sum: { quantity: 3 } },
      ]),
    },
  };

  const service = new AnalyticsService(
    store,
    productAnalytics,
    prisma as never,
  );

  it('tracks client events in store and provider', async () => {
    await service.trackEvent({
      event: 'add_to_cart',
      properties: { productId: 'p1' },
      sessionId: 'sess-1',
      source: 'web',
    });

    expect(store.record).toHaveBeenCalledWith(
      expect.objectContaining({ event: 'add_to_cart', sessionId: 'sess-1' }),
    );
    expect(productAnalytics.capture).toHaveBeenCalledWith(
      'sess-1',
      'add_to_cart',
      expect.objectContaining({ productId: 'p1' }),
    );
  });

  it('builds overview report', async () => {
    const report = await service.getOverview(30);
    expect(report.revenue).toBe(100);
    expect(report.orders).toBe(1);
    expect(report.topProducts[0]?.name).toBe('Product A');
  });

  it('builds weekly cohort retention', async () => {
    prisma.order.findMany.mockResolvedValue([
      {
        userId: 'u1',
        customerEmail: 'a@example.com',
        createdAt: new Date('2026-06-02T12:00:00.000Z'),
      },
      {
        userId: 'u1',
        customerEmail: 'a@example.com',
        createdAt: new Date('2026-06-16T12:00:00.000Z'),
      },
      {
        userId: 'u2',
        customerEmail: 'b@example.com',
        createdAt: new Date('2026-06-02T15:00:00.000Z'),
      },
    ]);

    const report = await service.getCohortRetention(4);
    expect(report.cohorts.length).toBeGreaterThan(0);
    expect(report.cohorts[0]?.retentionByWeek[0]).toBe(100);
  });
});
