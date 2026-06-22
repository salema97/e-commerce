import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InvoiceProvider } from './invoice-provider.interface.js';
import { DirectSriInvoiceProvider } from './sri/sri-invoice.provider.js';

@Injectable()
export class InvoiceProviderFactory {
  constructor(
    private readonly configService: ConfigService,
    private readonly directSriProvider: DirectSriInvoiceProvider,
  ) {}

  getProvider(): InvoiceProvider {
    const mode = this.configService.get<string>('SRI_MODE') ?? 'direct';
    switch (mode) {
      case 'direct':
        return this.directSriProvider;
      default:
        throw new Error(`Unsupported invoice provider mode: ${mode}`);
    }
  }
}
