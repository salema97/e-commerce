import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import { ShippingZoneType } from '@prisma/client';
import { ZoneFlatRateProvider } from './zone-flat-rate.provider.js';
import { CarrierRateProviderFactory } from './carrier-rate-provider.factory.js';
import { ShippingService } from './shipping.service.js';
import { ShippoCarrierRateProvider } from './shippo-carrier-rate.provider.js';
import { EasyPostCarrierRateProvider } from './easypost-carrier-rate.provider.js';
import { ShipEngineCarrierRateProvider } from './shipengine-carrier-rate.provider.js';
import { ServientregaQuoteClient } from './servientrega/servientrega-quote.client.js';
import { ServientregaCityService } from './servientrega/servientrega-city.service.js';
import { ServientregaCitySyncService } from './servientrega/servientrega-city-sync.service.js';
import { ServientregaCarrierRateProvider } from './servientrega/servientrega-carrier-rate.provider.js';
import { PrismaService } from '../prisma/prisma.service.js';

describe('ShippingService', () => {
  let service: ShippingService;

  const zones = [
    {
      id: '1',
      name: 'Ecuador continental',
      code: 'EC-DOMESTIC',
      zoneType: ShippingZoneType.DOMESTIC,
      provinces: [],
      baseRate: new Prisma.Decimal(5),
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  beforeEach(async () => {
    const prisma = {
      shippingZone: { findMany: vi.fn().mockResolvedValue(zones) },
      servientregaCity: { findFirst: vi.fn(), upsert: vi.fn() },
    };
    const config = {
      get: vi.fn((key: string) => {
        if (key === 'SHIPPING_FREE_THRESHOLD') return 50;
        if (key === 'SHIPPING_FLAT_RATE') return 5;
        if (key === 'CARRIER_RATE_PROVIDER') return 'zones';
        return undefined;
      }),
    };

    const module = await Test.createTestingModule({
      providers: [
        ZoneFlatRateProvider,
        ShippoCarrierRateProvider,
        EasyPostCarrierRateProvider,
        ShipEngineCarrierRateProvider,
        ServientregaQuoteClient,
        ServientregaCityService,
        ServientregaCitySyncService,
        ServientregaCarrierRateProvider,
        CarrierRateProviderFactory,
        ShippingService,
        { provide: PrismaService, useValue: prisma },
        { provide: ConfigService, useValue: config },
      ],
    }).compile();

    service = module.get(ShippingService);
  });

  it('quotes domestic flat rate', async () => {
    const quote = await service.quote({ country: 'EC', province: 'Pichincha', subtotal: 20 });
    expect(quote.amount).toBe(5);
    expect(quote.provider).toBe('zones');
  });

  it('applies free shipping above threshold', async () => {
    const quote = await service.quote({ country: 'EC', subtotal: 60 });
    expect(quote.amount).toBe(0);
    expect(quote.freeShippingApplied).toBe(true);
  });
});
