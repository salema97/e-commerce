import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FulfillmentProvider } from './fulfillment-provider.interface.js';
import { ManualFulfillmentProvider } from './manual-fulfillment.provider.js';

export type FulfillmentProviderName = 'manual' | 'wms';

@Injectable()
export class FulfillmentProviderFactory {
  constructor(
    private readonly config: ConfigService,
    private readonly manualProvider: ManualFulfillmentProvider,
  ) {}

  resolve(): FulfillmentProvider {
    const configured = this.config.get<string>('FULFILLMENT_PROVIDER')?.toLowerCase();
    // WMS path reuses manual provider with webhook/sync endpoints for now.
    if (configured === 'wms' || configured === 'manual') {
      return this.manualProvider;
    }
    return this.manualProvider;
  }
}
