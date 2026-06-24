import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CarrierRateProviderFactory } from './carrier-rate-provider.factory.js';
import type { CarrierRateQuoteInput, CarrierRateQuoteResult } from './carrier-rate-provider.interface.js';

export interface ShippingQuoteInput {
  country?: string;
  province?: string;
  city?: string;
  street?: string;
  zipCode?: string;
  subtotal: number;
  freeShipping?: boolean;
  weightKg?: number;
}

export type ShippingQuote = CarrierRateQuoteResult;

@Injectable()
export class ShippingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly carrierRateFactory: CarrierRateProviderFactory,
  ) {}

  async listZones() {
    return this.prisma.shippingZone.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
  }

  async quote(input: ShippingQuoteInput): Promise<ShippingQuote> {
    const carrierInput: CarrierRateQuoteInput = {
      destination: {
        country: input.country,
        province: input.province,
        city: input.city,
        street: input.street,
        zipCode: input.zipCode,
      },
      subtotal: input.subtotal,
      freeShipping: input.freeShipping,
      parcel: { weightKg: input.weightKg ?? 1 },
    };

    const provider = this.carrierRateFactory.resolve();
    return provider.quote(carrierInput);
  }
}
