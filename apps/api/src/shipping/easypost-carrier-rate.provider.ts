import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  CarrierRateProvider,
  CarrierRateQuoteInput,
  CarrierRateQuoteResult,
} from './carrier-rate-provider.interface.js';
import { ZoneFlatRateProvider } from './zone-flat-rate.provider.js';
import { resilientFetch } from '../common/resilience/resilient-fetch.js';

interface EasyPostRate {
  rate: string;
  currency: string;
  carrier: string;
  service: string;
  delivery_days?: number;
}

@Injectable()
export class EasyPostCarrierRateProvider extends CarrierRateProvider {
  private readonly logger = new Logger(EasyPostCarrierRateProvider.name);

  constructor(
    private readonly config: ConfigService,
    private readonly fallback: ZoneFlatRateProvider,
  ) {
    super();
  }

  async quote(input: CarrierRateQuoteInput): Promise<CarrierRateQuoteResult> {
    const apiKey = this.config.get<string>('EASYPOST_API_KEY');
    if (!apiKey) {
      const fallback = await this.fallback.quote(input);
      return { ...fallback, provider: 'easypost-fallback' };
    }

    try {
      const body = {
        shipment: {
          to_address: this.toEasyPostAddress(input.destination),
          from_address: this.toEasyPostAddress(input.origin ?? input.destination),
          parcel: {
            weight: (input.parcel?.weightKg ?? 1) * 35.274,
            length: input.parcel?.lengthCm ?? 20,
            width: input.parcel?.widthCm ?? 15,
            height: input.parcel?.heightCm ?? 10,
          },
        },
      };

      const response = await resilientFetch('shipping.easypost', 'https://api.easypost.com/v2/shipments', {
        method: 'POST',
        headers: {
          Authorization: `Basic ${Buffer.from(`${apiKey}:`).toString('base64')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error(`EasyPost shipment failed: ${response.status}`);
      }

      const payload = (await response.json()) as { rates?: EasyPostRate[] };
      const rates = payload.rates ?? [];
      if (!rates.length) {
        throw new Error('EasyPost returned no rates');
      }

      const cheapest = [...rates].sort(
        (a, b) => Number(a.rate) - Number(b.rate),
      )[0];

      const fallback = await this.fallback.quote(input);
      const options = rates.slice(0, 5).map((rate) => ({
        provider: 'easypost',
        carrier: rate.carrier,
        service: rate.service,
        amount: Number(rate.rate),
        currency: rate.currency,
        estimatedDaysMin: rate.delivery_days ?? 2,
        estimatedDaysMax: (rate.delivery_days ?? 2) + 2,
      }));

      return {
        amount: Number(cheapest.rate),
        zoneCode: fallback.zoneCode,
        zoneName: fallback.zoneName,
        freeShippingApplied: fallback.freeShippingApplied,
        estimatedDaysMin: cheapest.delivery_days ?? fallback.estimatedDaysMin,
        estimatedDaysMax: (cheapest.delivery_days ?? fallback.estimatedDaysMin) + 2,
        provider: 'easypost',
        options,
      };
    } catch (error) {
      this.logger.warn({ error }, 'EasyPost rate quote failed; using zone fallback');
      const fallback = await this.fallback.quote(input);
      return { ...fallback, provider: 'easypost-fallback' };
    }
  }

  private toEasyPostAddress(address: CarrierRateQuoteInput['destination']) {
    return {
      country: address.country ?? 'EC',
      state: address.province ?? '',
      city: address.city ?? '',
      street1: address.street ?? 'N/A',
      zip: address.zipCode ?? '',
    };
  }
}
