import { Injectable, OnModuleInit, Inject } from '@nestjs/common';
import type { DomainEvent } from '@repo/shared-types';
import { EventBus } from '../event-bus/event-bus.interface.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { LoyaltyService } from '../loyalty/loyalty.service.js';
import { ReferralsService } from '../referrals/referrals.service.js';

@Injectable()
export class OrderPaidEngagementConsumer implements OnModuleInit {
  constructor(
    @Inject(EventBus) private readonly eventBus: EventBus,
    private readonly prisma: PrismaService,
    private readonly loyaltyService: LoyaltyService,
    private readonly referralsService: ReferralsService,
  ) {}

  onModuleInit(): void {
    this.eventBus.registerHandler((event) => this.handle(event));
  }

  private async handle(event: DomainEvent): Promise<void> {
    if (event.name !== 'order.paid' || !event.payload.orderId) {
      return;
    }

    const order = await this.prisma.order.findUnique({
      where: { id: String(event.payload.orderId) },
    });

    if (!order?.userId) {
      return;
    }

    await this.loyaltyService.earnForPurchase(order.userId, order.id, Number(order.total));

    if (order.referralCode) {
      await this.referralsService.recordConversion(order.id, order.referralCode, order.userId);
    }
  }
}
