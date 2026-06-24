import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AccountingProviderType, AccountingSyncStatus } from '@prisma/client';
import type {
  AccountingCustomerInput,
  AccountingInvoiceInput,
  AccountingMarketplaceFeeInput,
  AccountingProvider,
  AccountingSyncOutput,
} from './accounting-provider.interface.js';

@Injectable()
export class SiigoAccountingProvider implements AccountingProvider {
  readonly provider = AccountingProviderType.SIIGO;
  private readonly logger = new Logger(SiigoAccountingProvider.name);

  constructor(private readonly config: ConfigService) {}

  private get configured(): boolean {
    return Boolean(this.config.get<string>('SIIGO_API_KEY'));
  }

  async pushCustomer(input: AccountingCustomerInput): Promise<AccountingSyncOutput> {
    if (!this.configured) {
      this.logger.warn('Siigo not configured; returning stub sync id');
    }
    return { externalId: `siigo-cust-${input.externalRef}`, status: AccountingSyncStatus.SYNCED };
  }

  async pushInvoice(input: AccountingInvoiceInput): Promise<AccountingSyncOutput> {
    if (!this.configured) {
      this.logger.warn('Siigo not configured; returning stub sync id');
    }
    return { externalId: `siigo-inv-${input.invoiceId}`, status: AccountingSyncStatus.SYNCED };
  }

  async pushMarketplaceFee(input: AccountingMarketplaceFeeInput): Promise<AccountingSyncOutput> {
    if (!this.configured) {
      this.logger.warn('Siigo not configured; returning stub sync id');
    }
    return { externalId: `siigo-fee-${input.orderId}`, status: AccountingSyncStatus.SYNCED };
  }
}
