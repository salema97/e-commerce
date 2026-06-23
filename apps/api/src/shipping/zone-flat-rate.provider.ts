import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ShippingZoneType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import {
  CarrierRateProvider,
  CarrierRateQuoteInput,
  CarrierRateQuoteResult,
} from './carrier-rate-provider.interface.js';

const ECUADOR_COUNTRY_CODES = new Set(['EC', 'ECU', 'ECUADOR']);

@Injectable()
export class ZoneFlatRateProvider extends CarrierRateProvider {
  private readonly freeShippingThreshold: number;
  private readonly defaultFlatRate: number;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {
    super();
    this.freeShippingThreshold = Number(this.config.get('SHIPPING_FREE_THRESHOLD') ?? 50);
    this.defaultFlatRate = Number(this.config.get('SHIPPING_FLAT_RATE') ?? 5);
  }

  async quote(input: CarrierRateQuoteInput): Promise<CarrierRateQuoteResult> {
    const zones = await this.prisma.shippingZone.findMany({ where: { isActive: true } });
    const country = input.destination.country?.trim().toUpperCase();
    const province = input.destination.province?.trim();

    let zone = zones.find((z) => z.zoneType === ShippingZoneType.DOMESTIC);

    if (country && !ECUADOR_COUNTRY_CODES.has(country)) {
      zone = zones.find((z) => z.zoneType === ShippingZoneType.INTERNATIONAL) ?? zone;
    } else if (province) {
      const excluded = zones.find(
        (z) =>
          z.zoneType === ShippingZoneType.EXCLUDED &&
          z.provinces.some((p) => p.toLowerCase() === province.toLowerCase()),
      );
      if (excluded) {
        zone = excluded;
      } else {
        const regional = zones.find(
          (z) =>
            z.zoneType === ShippingZoneType.DOMESTIC &&
            z.provinces.length > 0 &&
            z.provinces.some((p) => p.toLowerCase() === province.toLowerCase()),
        );
        if (regional) zone = regional;
      }
    }

    const baseAmount = zone ? Number(zone.baseRate) : this.defaultFlatRate;
    const qualifiesForFree =
      Boolean(input.freeShipping) || input.subtotal >= this.freeShippingThreshold;
    const amount = qualifiesForFree ? 0 : baseAmount;

    return {
      amount: Number(amount.toFixed(2)),
      zoneCode: zone?.code ?? 'EC-DOMESTIC',
      zoneName: zone?.name ?? 'Ecuador continental',
      freeShippingApplied: qualifiesForFree,
      estimatedDaysMin: zone?.zoneType === ShippingZoneType.INTERNATIONAL ? 7 : 2,
      estimatedDaysMax: zone?.zoneType === ShippingZoneType.INTERNATIONAL ? 14 : 5,
      provider: 'zones',
    };
  }
}
