import { Injectable } from '@nestjs/common';
import type { AnalyticsEventInput, AnalyticsOverviewReport, CohortRetentionReport, DomainEvent } from '@repo/shared-types';
import { OrderStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { AnalyticsEventStore } from './analytics-event-store.interface.js';
import { ProductAnalyticsProvider } from './product-analytics-provider.interface.js';

@Injectable()
export class AnalyticsService {
  constructor(
    private readonly store: AnalyticsEventStore,
    private readonly productAnalytics: ProductAnalyticsProvider,
    private readonly prisma: PrismaService,
  ) {}

  async trackEvent(input: AnalyticsEventInput): Promise<void> {
    await this.store.record(input);
    const distinctId = input.userId ?? input.sessionId ?? 'anonymous';
    await this.productAnalytics.capture(distinctId, input.event, {
      ...input.properties,
      source: input.source,
    });
  }

  async handleDomainEvent(event: DomainEvent): Promise<void> {
    await this.store.recordDomainEvent(event.name, event.payload as Record<string, unknown>);
    await this.productAnalytics.capture('system', event.name, event.payload);
  }

  async getOverview(days = 30): Promise<AnalyticsOverviewReport> {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const [paidOrders, purchaseEvents, topItems] = await Promise.all([
      this.prisma.order.findMany({
        where: {
          status: { in: [OrderStatus.PROCESSING, OrderStatus.SHIPPED, OrderStatus.DELIVERED] },
          createdAt: { gte: since },
        },
        select: { id: true, total: true },
      }),
      this.prisma.analyticsEventRecord.count({
        where: { event: 'purchase', createdAt: { gte: since } },
      }),
      this.prisma.orderItem.groupBy({
        by: ['productId', 'name'],
        _sum: { quantity: true },
        orderBy: { _sum: { quantity: 'desc' } },
        take: 5,
      }),
    ]);

    const productViews = await this.prisma.analyticsEventRecord.count({
      where: { event: 'product_view', createdAt: { gte: since } },
    });

    const revenue = paidOrders.reduce((sum, order) => sum + Number(order.total), 0);
    const orders = paidOrders.length;
    const conversionRate =
      productViews > 0 ? Math.round((purchaseEvents / productViews) * 10000) / 100 : 0;

    return {
      revenue,
      orders,
      paidOrders: orders,
      conversionRate,
      topProducts: topItems.map((item) => ({
        productId: item.productId,
        name: item.name,
        quantity: item._sum.quantity ?? 0,
      })),
    };
  }

  async getFunnel(days = 30): Promise<Record<string, number>> {
    const since = new Date();
    since.setDate(since.getDate() - days);
    const steps = ['product_view', 'add_to_cart', 'begin_checkout', 'purchase'] as const;
    const counts: Record<string, number> = {};

    await Promise.all(
      steps.map(async (step) => {
        counts[step] = await this.prisma.analyticsEventRecord.count({
          where: { event: step, createdAt: { gte: since } },
        });
      }),
    );

    return counts;
  }

  async isFeatureEnabled(flag: string, distinctId: string): Promise<boolean> {
    return this.productAnalytics.isFeatureEnabled(flag, distinctId);
  }

  async getCohortRetention(weeks = 8): Promise<CohortRetentionReport> {
    const since = new Date();
    since.setUTCDate(since.getUTCDate() - weeks * 7);

    const orders = await this.prisma.order.findMany({
      where: {
        status: { in: [OrderStatus.PROCESSING, OrderStatus.SHIPPED, OrderStatus.DELIVERED] },
        createdAt: { gte: since },
      },
      select: {
        userId: true,
        customerEmail: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    const customerOrders = new Map<string, { cohortWeek: string; orderWeeks: Set<string> }>();

    for (const order of orders) {
      const customerKey = order.userId ?? order.customerEmail;
      if (!customerKey) {
        continue;
      }

      const orderWeek = weekStartKey(order.createdAt);
      const existing = customerOrders.get(customerKey);
      if (!existing) {
        customerOrders.set(customerKey, {
          cohortWeek: orderWeek,
          orderWeeks: new Set([orderWeek]),
        });
        continue;
      }

      existing.orderWeeks.add(orderWeek);
      if (orderWeek < existing.cohortWeek) {
        existing.cohortWeek = orderWeek;
      }
    }

    const cohortMap = new Map<string, Array<{ orderWeeks: Set<string> }>>();
    for (const profile of customerOrders.values()) {
      const list = cohortMap.get(profile.cohortWeek) ?? [];
      list.push({ orderWeeks: profile.orderWeeks });
      cohortMap.set(profile.cohortWeek, list);
    }

    const cohorts = [...cohortMap.entries()]
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([cohortWeek, customers]) => {
        const cohortSize = customers.length;
        const retentionByWeek = Array.from({ length: weeks }, (_, offset) => {
          if (cohortSize === 0) {
            return 0;
          }
          const targetWeek = addWeeks(cohortWeek, offset);
          const retained = customers.filter((customer) => customer.orderWeeks.has(targetWeek)).length;
          return Math.round((retained / cohortSize) * 10000) / 100;
        });

        return { cohortWeek, cohortSize, retentionByWeek };
      });

    return { weeks, cohorts };
  }
}

function weekStartKey(date: Date): string {
  const utc = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = utc.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  utc.setUTCDate(utc.getUTCDate() + diff);
  return utc.toISOString().slice(0, 10);
}

function addWeeks(weekStartIso: string, weeks: number): string {
  const date = new Date(`${weekStartIso}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + weeks * 7);
  return date.toISOString().slice(0, 10);
}
