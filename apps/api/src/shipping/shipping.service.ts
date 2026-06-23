import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ShippingZoneType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';

export interface ShippingQuoteInput {
  country?: string;
  province?: string;
  subtotal: number;
  freeShipping?: boolean;
}

export interface ShippingQuote {
  amount: number;
  zoneCode: string;
  zoneName: string;
  freeShippingApplied: boolean;
  estimatedDaysMin: number;
  estimatedDaysMax: number;
}

const ECUADOR_COUNTRY_CODES = new Set(['EC', 'ECU', 'ECUADOR']);

@Injectable()
export class ShippingService {
  private readonly freeShippingThreshold: number;
  private readonly defaultFlatRate: number;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {
    this.freeShippingThreshold = Number(this.config.get('SHIPPING_FREE_THRESHOLD') ?? 50);
    this.defaultFlatRate = Number(this.config.get('SHIPPING_FLAT_RATE') ?? 5);
  }

  async listZones() {
    return this.prisma.shippingZone.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
  }

  async quote(input: ShippingQuoteInput): Promise<ShippingQuote> {
    const zones = await this.prisma.shippingZone.findMany({
      where: { isActive: true },
    });

    const country = input.country?.trim().toUpperCase();
    const province = input.province?.trim();

    let zone = zones.find((z) => z.zoneType === ShippingZoneType.DOMESTIC);

    if (country && !ECUADOR_COUNTRY_CODES.has(country)) {
      zone =
        zones.find((z) => z.zoneType === ShippingZoneType.INTERNATIONAL) ?? zone;
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
        if (regional) {
          zone = regional;
        }
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
    };
  }
}
