import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  CarrierRateProvider,
  CarrierRateQuoteInput,
  CarrierRateQuoteResult,
} from './carrier-rate-provider.interface.js';
import { ZoneFlatRateProvider } from './zone-flat-rate.provider.js';
import { resilientFetch } from '../common/resilience/resilient-fetch.js';

interface ShippoRate {
  amount: string;
  currency: string;
  provider: string;
  servicelevel?: { name?: string; token?: string };
  estimated_days?: number;
}

@Injectable()
export class ShippoCarrierRateProvider extends CarrierRateProvider {
  private readonly logger = new Logger(ShippoCarrierRateProvider.name);

  constructor(
    private readonly config: ConfigService,
    private readonly fallback: ZoneFlatRateProvider,
  ) {
    super();
  }

  async quote(input: CarrierRateQuoteInput): Promise<CarrierRateQuoteResult> {
    const apiKey = this.config.get<string>('SHIPPO_API_KEY');
    if (!apiKey) {
      const fallback = await this.fallback.quote(input);
      return { ...fallback, provider: 'shippo-fallback' };
    }

    try {
      const body = {
        address_from: this.toShippoAddress(input.origin),
        address_to: this.toShippoAddress(input.destination),
        parcels: [
          {
            weight: String(input.parcel?.weightKg ?? 1),
            mass_unit: 'kg',
            length: String(input.parcel?.lengthCm ?? 20),
            width: String(input.parcel?.widthCm ?? 15),
            height: String(input.parcel?.heightCm ?? 10),
            distance_unit: 'cm',
          },
        ],
        async: false,
      };

      const shipmentRes = await resilientFetch('shipping.shippo', 'https://api.goshippo.com/shipments/', {
        method: 'POST',
        headers: {
          Authorization: `ShippoToken ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!shipmentRes.ok) {
        throw new Error(`Shippo shipment failed: ${shipmentRes.status}`);
      }

      const shipment = (await shipmentRes.json()) as { rates?: ShippoRate[] };
      const rates = shipment.rates ?? [];
      if (!rates.length) {
        throw new Error('Shippo returned no rates');
      }

      const cheapest = [...rates].sort(
        (a, b) => Number(a.amount) - Number(b.amount),
      )[0];

      const options = rates.slice(0, 5).map((rate) => ({
        provider: 'shippo',
        carrier: rate.provider,
        service: rate.servicelevel?.name ?? rate.servicelevel?.token ?? 'standard',
        amount: Number(rate.amount),
        currency: rate.currency,
        estimatedDaysMin: rate.estimated_days ?? 2,
        estimatedDaysMax: (rate.estimated_days ?? 2) + 2,
      }));

      const fallback = await this.fallback.quote(input);

      return {
        amount: Number(cheapest.amount),
        zoneCode: fallback.zoneCode,
        zoneName: fallback.zoneName,
        freeShippingApplied: fallback.freeShippingApplied,
        estimatedDaysMin: cheapest.estimated_days ?? fallback.estimatedDaysMin,
        estimatedDaysMax: (cheapest.estimated_days ?? fallback.estimatedDaysMin) + 2,
        provider: 'shippo',
        options,
      };
    } catch (error) {
      this.logger.warn({ error }, 'Shippo rate quote failed; using zone fallback');
      const fallback = await this.fallback.quote(input);
      return { ...fallback, provider: 'shippo-fallback' };
    }
  }

  private toShippoAddress(address?: CarrierRateQuoteInput['destination']) {
    return {
      country: address?.country ?? 'EC',
      state: address?.province ?? '',
      city: address?.city ?? '',
      street1: address?.street ?? 'N/A',
      zip: address?.zipCode ?? '',
    };
  }
}
