import { Injectable, OnModuleInit, Inject } from '@nestjs/common';
import type { DomainEvent } from '@repo/shared-types';
import { EventBus } from '../event-bus/event-bus.interface.js';
import { AccountingService } from './accounting.service.js';

@Injectable()
export class InvoiceAuthorizedAccountingConsumer implements OnModuleInit {
  constructor(
    @Inject(EventBus) private readonly eventBus: EventBus,
    private readonly accountingService: AccountingService,
  ) {}

  onModuleInit(): void {
    this.eventBus.registerHandler((event) => this.handle(event));
  }

  private async handle(event: DomainEvent): Promise<void> {
    if (event.name !== 'invoice.authorized' || !event.payload.invoiceId) {
      return;
    }

    await this.accountingService.syncAuthorizedInvoice(String(event.payload.invoiceId));
  }
}
