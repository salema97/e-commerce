import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import type { DomainEvent } from '@repo/shared-types';
import { EventBus } from '../event-bus/event-bus.interface.js';
import { OrderConfirmationService } from './order-confirmation.service.js';

@Injectable()
export class OrderPaidDomainConsumer implements OnModuleInit {
  constructor(
    @Inject(EventBus) private readonly eventBus: EventBus,
    private readonly orderConfirmation: OrderConfirmationService,
  ) {}

  onModuleInit(): void {
    this.eventBus.registerHandler((event) => this.handle(event));
  }

  private async handle(event: DomainEvent): Promise<void> {
    if (event.name !== 'order.paid' || !event.payload.orderId) {
      return;
    }

    await this.orderConfirmation.sendPaidOrderNotifications(String(event.payload.orderId));
  }
}
