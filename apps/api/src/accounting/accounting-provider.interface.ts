import type { AccountingProviderType, AccountingSyncStatus } from '@prisma/client';

export interface AccountingCustomerInput {
  externalRef: string;
  name: string;
  email: string;
  taxId?: string | null;
}

export interface AccountingInvoiceInput {
  invoiceId: string;
  orderId: string;
  authorizationNumber?: string | null;
  accessKey: string;
  total: number;
  customer: AccountingCustomerInput;
}

export interface AccountingMarketplaceFeeInput {
  orderId: string;
  channel: string;
  fees: number;
  orderTotal: number;
  externalOrderId?: string | null;
}

export interface AccountingSyncOutput {
  externalId: string;
  status: AccountingSyncStatus;
}

export interface AccountingProvider {
  readonly provider: AccountingProviderType;
  pushCustomer(input: AccountingCustomerInput): Promise<AccountingSyncOutput>;
  pushInvoice(input: AccountingInvoiceInput): Promise<AccountingSyncOutput>;
  pushMarketplaceFee(input: AccountingMarketplaceFeeInput): Promise<AccountingSyncOutput>;
}
