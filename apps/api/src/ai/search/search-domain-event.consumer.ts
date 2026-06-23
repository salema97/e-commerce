import { Injectable, OnModuleInit, Inject } from '@nestjs/common';
import type { DomainEvent } from '@repo/shared-types';
import { EventBus } from '../../event-bus/event-bus.interface.js';
import { ProductSearchSyncService } from './product-search-sync.service.js';

@Injectable()
export class SearchDomainEventConsumer implements OnModuleInit {
  constructor(
    @Inject(EventBus) private readonly eventBus: EventBus,
    private readonly searchSync: ProductSearchSyncService,
  ) {}

  onModuleInit(): void {
    this.eventBus.registerHandler((event) => this.handle(event));
  }

  private async handle(event: DomainEvent): Promise<void> {
    if (event.name === 'product.updated' && event.payload.productId) {
      await this.searchSync.syncProduct(String(event.payload.productId));
    }
    if (event.name === 'inventory.changed' && event.payload.productId) {
      await this.searchSync.syncProduct(String(event.payload.productId));
    }
  }
}
