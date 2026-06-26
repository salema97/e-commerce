import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  CarrierRateProvider,
  CarrierRateQuoteInput,
  CarrierRateQuoteResult,
} from './carrier-rate-provider.interface.js';
import { ZoneFlatRateProvider } from './zone-flat-rate.provider.js';
import { resilientFetch } from '../common/resilience/resilient-fetch.js';

@Injectable()
export class ShipEngineCarrierRateProvider extends CarrierRateProvider {
  private readonly logger = new Logger(ShipEngineCarrierRateProvider.name);

  constructor(
    private readonly config: ConfigService,
    private readonly fallback: ZoneFlatRateProvider,
  ) {
    super();
  }

  async quote(input: CarrierRateQuoteInput): Promise<CarrierRateQuoteResult> {
    const apiKey = this.config.get<string>('SHIPENGINE_API_KEY');
    if (!apiKey) {
      const fallback = await this.fallback.quote(input);
      return { ...fallback, provider: 'shipengine-fallback' };
    }

    try {
      const body = {
        rate_options: { carrier_ids: [] },
        shipment: {
          ship_to: this.toShipEngineAddress(input.destination),
          ship_from: this.toShipEngineAddress(input.origin ?? input.destination),
          packages: [
            {
              weight: { value: input.parcel?.weightKg ?? 1, unit: 'kilogram' },
              dimensions: {
                length: input.parcel?.lengthCm ?? 20,
                width: input.parcel?.widthCm ?? 15,
                height: input.parcel?.heightCm ?? 10,
                unit: 'centimeter',
              },
            },
          ],
        },
      };

      const response = await resilientFetch('shipping.shipengine', 'https://api.shipengine.com/v1/rates', {
        method: 'POST',
        headers: {
          'API-Key': apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error(`ShipEngine rates failed: ${response.status}`);
      }

      const payload = (await response.json()) as {
        rate_response?: {
          rates?: Array<{
            shipping_amount: { amount: number; currency: string };
            carrier_friendly_name: string;
            service_type: string;
            delivery_days?: number;
          }>;
        };
      };

      const rates = payload.rate_response?.rates ?? [];
      if (!rates.length) {
        throw new Error('ShipEngine returned no rates');
      }

      const cheapest = [...rates].sort(
        (a, b) => a.shipping_amount.amount - b.shipping_amount.amount,
      )[0];

      const fallback = await this.fallback.quote(input);
      const options = rates.slice(0, 5).map((rate) => ({
        provider: 'shipengine',
        carrier: rate.carrier_friendly_name,
        service: rate.service_type,
        amount: rate.shipping_amount.amount,
        currency: rate.shipping_amount.currency,
        estimatedDaysMin: rate.delivery_days ?? 2,
        estimatedDaysMax: (rate.delivery_days ?? 2) + 2,
      }));

      return {
        amount: cheapest.shipping_amount.amount,
        zoneCode: fallback.zoneCode,
        zoneName: fallback.zoneName,
        freeShippingApplied: fallback.freeShippingApplied,
        estimatedDaysMin: cheapest.delivery_days ?? fallback.estimatedDaysMin,
        estimatedDaysMax: (cheapest.delivery_days ?? fallback.estimatedDaysMin) + 2,
        provider: 'shipengine',
        options,
      };
    } catch (error) {
      this.logger.warn({ error }, 'ShipEngine rate quote failed; using zone fallback');
      const fallback = await this.fallback.quote(input);
      return { ...fallback, provider: 'shipengine-fallback' };
    }
  }

  private toShipEngineAddress(address: CarrierRateQuoteInput['destination']) {
    return {
      country_code: address.country ?? 'EC',
      state_province: address.province ?? '',
      city_locality: address.city ?? '',
      address_line1: address.street ?? 'N/A',
      postal_code: address.zipCode ?? '',
    };
  }
}
