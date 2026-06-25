import { Injectable, Logger } from '@nestjs/common';
import { AccountingProviderType, AccountingSyncStatus } from '@prisma/client';
import type {
  AccountingCustomerInput,
  AccountingInvoiceInput,
  AccountingMarketplaceFeeInput,
  AccountingProvider,
  AccountingSyncOutput,
} from './accounting-provider.interface.js';

@Injectable()
export class ConsoleAccountingProvider implements AccountingProvider {
  readonly provider = AccountingProviderType.CONSOLE;
  private readonly logger = new Logger(ConsoleAccountingProvider.name);

  pushCustomer(input: AccountingCustomerInput): Promise<AccountingSyncOutput> {
    this.logger.debug(`[console] push customer ${input.externalRef}`);
    return Promise.resolve({
      externalId: `console-cust-${input.externalRef}`,
      status: AccountingSyncStatus.SYNCED,
    });
  }

  pushInvoice(input: AccountingInvoiceInput): Promise<AccountingSyncOutput> {
    this.logger.debug(`[console] push invoice ${input.invoiceId}`);
    return Promise.resolve({
      externalId: `console-inv-${input.invoiceId}`,
      status: AccountingSyncStatus.SYNCED,
    });
  }

  pushMarketplaceFee(input: AccountingMarketplaceFeeInput): Promise<AccountingSyncOutput> {
    this.logger.debug(`[console] push marketplace fee order ${input.orderId}`);
    return Promise.resolve({
      externalId: `console-fee-${input.orderId}`,
      status: AccountingSyncStatus.SYNCED,
    });
  }
}
