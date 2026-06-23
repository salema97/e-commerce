import { Injectable } from '@nestjs/common';
import { OrderStatus, Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';

export type MarketingSegment =
  | 'ALL_CUSTOMERS'
  | 'HAS_ACTIVE_CART'
  | 'RECENT_BUYERS'
  | 'INACTIVE_BUYERS'
  | `ROLE_${Role}`;

@Injectable()
export class NotificationSegmentService {
  constructor(private readonly prisma: PrismaService) {}

  async resolveUserIds(segment: MarketingSegment): Promise<string[]> {
    if (segment.startsWith('ROLE_')) {
      const role = segment.replace('ROLE_', '') as Role;
      const users = await this.prisma.user.findMany({
        where: { role, marketingEmailOptOut: false },
        select: { id: true },
      });
      return users.map((user) => user.id);
    }

    switch (segment) {
      case 'ALL_CUSTOMERS': {
        const users = await this.prisma.user.findMany({
          where: { role: Role.CUSTOMER, marketingEmailOptOut: false },
          select: { id: true },
        });
        return users.map((user) => user.id);
      }
      case 'HAS_ACTIVE_CART': {
        const carts = await this.prisma.cart.findMany({
          where: {
            userId: { not: null },
            items: { some: {} },
            user: { marketingEmailOptOut: false },
          },
          select: { userId: true },
        });
        return carts
          .map((cart) => cart.userId)
          .filter((userId): userId is string => Boolean(userId));
      }
      case 'RECENT_BUYERS': {
        const since = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
        const orders = await this.prisma.order.findMany({
          where: {
            userId: { not: null },
            status: { in: [OrderStatus.COMPLETED, OrderStatus.DELIVERED, OrderStatus.SHIPPED] },
            createdAt: { gte: since },
          },
          select: { userId: true },
          distinct: ['userId'],
        });
        return orders
          .map((order) => order.userId)
          .filter((userId): userId is string => Boolean(userId));
      }
      case 'INACTIVE_BUYERS': {
        const recentBuyerIds = await this.resolveUserIds('RECENT_BUYERS');
        const users = await this.prisma.user.findMany({
          where: {
            role: Role.CUSTOMER,
            marketingEmailOptOut: false,
            orders: {
              some: {
                status: {
                  in: [OrderStatus.COMPLETED, OrderStatus.DELIVERED, OrderStatus.SHIPPED],
                },
              },
            },
            id: { notIn: recentBuyerIds },
          },
          select: { id: true },
        });
        return users.map((user) => user.id);
      }
      default:
        return [];
    }
  }

  async resolveEmails(segment: MarketingSegment): Promise<Array<{ userId: string; email: string }>> {
    const userIds = await this.resolveUserIds(segment);
    if (userIds.length === 0) {
      return [];
    }

    const users = await this.prisma.user.findMany({
      where: { id: { in: userIds }, marketingEmailOptOut: false },
      select: { id: true, email: true },
    });

    return users.map((user) => ({ userId: user.id, email: user.email }));
  }
}
