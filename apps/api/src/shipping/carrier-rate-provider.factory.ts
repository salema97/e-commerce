import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CarrierRateProvider } from './carrier-rate-provider.interface.js';
import { ZoneFlatRateProvider } from './zone-flat-rate.provider.js';
import { ShippoCarrierRateProvider } from './shippo-carrier-rate.provider.js';
import { EasyPostCarrierRateProvider } from './easypost-carrier-rate.provider.js';
import { ShipEngineCarrierRateProvider } from './shipengine-carrier-rate.provider.js';

export type CarrierRateProviderName = 'zones' | 'shippo' | 'easypost' | 'shipengine';

@Injectable()
export class CarrierRateProviderFactory {
  constructor(
    private readonly config: ConfigService,
    private readonly zoneProvider: ZoneFlatRateProvider,
    private readonly shippoProvider: ShippoCarrierRateProvider,
    private readonly easyPostProvider: EasyPostCarrierRateProvider,
    private readonly shipEngineProvider: ShipEngineCarrierRateProvider,
  ) {}

  resolve(provider?: CarrierRateProviderName): CarrierRateProvider {
    const configured =
      provider ??
      (this.config.get<string>('CARRIER_RATE_PROVIDER')?.toLowerCase() as
        | CarrierRateProviderName
        | undefined) ??
      'zones';

    switch (configured) {
      case 'shippo':
        return this.shippoProvider;
      case 'easypost':
        return this.easyPostProvider;
      case 'shipengine':
        return this.shipEngineProvider;
      case 'zones':
      default:
        return this.zoneProvider;
    }
  }
}
