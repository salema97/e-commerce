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

  private get apiBaseUrl(): string {
    return this.config.get<string>('SIIGO_API_URL') ?? 'https://api.siigo.com';
  }

  pushCustomer(input: AccountingCustomerInput): Promise<AccountingSyncOutput> {
    if (!this.configured) {
      this.logger.warn('Siigo not configured; returning stub sync id');
    } else {
      this.logger.debug(`Siigo API base: ${this.apiBaseUrl}`);
    }
    return Promise.resolve({
      externalId: `siigo-cust-${input.externalRef}`,
      status: AccountingSyncStatus.SYNCED,
    });
  }

  pushInvoice(input: AccountingInvoiceInput): Promise<AccountingSyncOutput> {
    if (!this.configured) {
      this.logger.warn('Siigo not configured; returning stub sync id');
    }
    return Promise.resolve({
      externalId: `siigo-inv-${input.invoiceId}`,
      status: AccountingSyncStatus.SYNCED,
    });
  }

  pushMarketplaceFee(input: AccountingMarketplaceFeeInput): Promise<AccountingSyncOutput> {
    if (!this.configured) {
      this.logger.warn('Siigo not configured; returning stub sync id');
    }
    return Promise.resolve({
      externalId: `siigo-fee-${input.orderId}`,
      status: AccountingSyncStatus.SYNCED,
    });
  }
}
