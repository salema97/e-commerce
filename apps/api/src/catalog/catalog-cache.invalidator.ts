import { Injectable, OnModuleInit, Inject } from '@nestjs/common';
import type { DomainEvent } from '@repo/shared-types';
import { EventBus } from '../event-bus/event-bus.interface.js';
import { CatalogCacheService } from './catalog-cache.service.js';

@Injectable()
export class CatalogCacheInvalidator implements OnModuleInit {
  constructor(
    @Inject(EventBus) private readonly eventBus: EventBus,
    private readonly cache: CatalogCacheService,
  ) {}

  onModuleInit(): void {
    this.eventBus.registerHandler((event) => this.handle(event));
  }

  private async handle(event: DomainEvent): Promise<void> {
    if (
      event.name === 'product.updated' ||
      event.name === 'product.deleted' ||
      event.name === 'inventory.changed'
    ) {
      await this.cache.invalidateCatalogQueries();
    }
  }
}
