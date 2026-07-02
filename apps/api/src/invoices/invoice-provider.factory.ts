import { Injectable } from '@nestjs/common';
import { InvoiceProvider } from './invoice-provider.interface.js';
import { DirectSriInvoiceProvider } from './sri/sri-invoice.provider.js';

@Injectable()
export class InvoiceProviderFactory {
  constructor(private readonly directSriProvider: DirectSriInvoiceProvider) {}

  getProvider(): InvoiceProvider {
    return this.directSriProvider;
  }
}
