import { Injectable, OnModuleInit, Inject } from '@nestjs/common';
import type { DomainEvent } from '@repo/shared-types';
import { EventBus } from '../event-bus/event-bus.interface.js';
import { SellersService } from './sellers.service.js';

@Injectable()
export class OrderPaidSellerConsumer implements OnModuleInit {
  constructor(
    @Inject(EventBus) private readonly eventBus: EventBus,
    private readonly sellersService: SellersService,
  ) {}

  onModuleInit(): void {
    this.eventBus.registerHandler((event) => this.handle(event));
  }

  private async handle(event: DomainEvent): Promise<void> {
    if (event.name !== 'order.paid' || !event.payload.orderId) {
      return;
    }
    await this.sellersService.createPayoutsForOrder(String(event.payload.orderId));
  }
}
