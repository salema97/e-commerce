import { describe, expect, it, vi, beforeEach } from 'vitest';
import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import { ShippingZoneType } from '@prisma/client';
import { ZoneFlatRateProvider } from '../zone-flat-rate.provider.js';
import { ServientregaCarrierRateProvider } from './servientrega-carrier-rate.provider.js';
import { ServientregaQuoteClient } from './servientrega-quote.client.js';
import { ServientregaCityService } from './servientrega-city.service.js';
import { PrismaService } from '../../prisma/prisma.service.js';

vi.mock('../../common/resilience/resilient-fetch.js', () => ({
  resilientFetch: vi.fn(),
}));

describe('ServientregaCarrierRateProvider', () => {
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

  let provider: ServientregaCarrierRateProvider;
  let quoteClient: ServientregaQuoteClient;

  beforeEach(async () => {
    const prisma = {
      shippingZone: { findMany: vi.fn().mockResolvedValue(zones) },
      servientregaCity: {
        findFirst: vi.fn().mockResolvedValue({
          servientregaCityId: 100,
          name: 'Quito',
        }),
        upsert: vi.fn(),
      },
    };

    const config = {
      get: vi.fn((key: string) => {
        if (key === 'SHIPPING_FREE_THRESHOLD') return 50;
        if (key === 'SHIPPING_FLAT_RATE') return 5;
        if (key === 'SERVIENTREGA_COUNTRY_ID') return 1;
        if (key === 'SERVIENTREGA_ORIGIN_CITY_ID') return 10;
        if (key === 'SERVIENTREGA_PRODUCT_ID') return 2;
        if (key === 'SERVIENTREGA_LANGUAGE') return 'es';
        return undefined;
      }),
    };

    const module = await Test.createTestingModule({
      providers: [
        ZoneFlatRateProvider,
        ServientregaQuoteClient,
        ServientregaCityService,
        ServientregaCarrierRateProvider,
        { provide: PrismaService, useValue: prisma },
        { provide: ConfigService, useValue: config },
      ],
    }).compile();

    provider = module.get(ServientregaCarrierRateProvider);
    quoteClient = module.get(ServientregaQuoteClient);
    vi.spyOn(quoteClient, 'getTariffs').mockResolvedValue([{ ValorTotal: 8.75, TiempoEntrega: 2 }]);
  });

  it('quotes servientrega tariff when configured', async () => {
    const quote = await provider.quote({
      destination: { country: 'EC', province: 'Pichincha', city: 'Quito' },
      subtotal: 30,
      parcel: { weightKg: 2 },
    });

    expect(quote.provider).toBe('servientrega');
    expect(quote.amount).toBe(8.75);
    expect(quote.options?.[0]?.carrier).toBe('Servientrega');
  });

  it('falls back to zones when servientrega is not configured', async () => {
    const config = {
      get: vi.fn((key: string) => {
        if (key === 'SHIPPING_FREE_THRESHOLD') return 50;
        if (key === 'SHIPPING_FLAT_RATE') return 5;
        return undefined;
      }),
    };

    const prisma = {
      shippingZone: { findMany: vi.fn().mockResolvedValue(zones) },
      servientregaCity: { findFirst: vi.fn(), upsert: vi.fn() },
    };

    const module = await Test.createTestingModule({
      providers: [
        ZoneFlatRateProvider,
        ServientregaQuoteClient,
        ServientregaCityService,
        ServientregaCarrierRateProvider,
        { provide: PrismaService, useValue: prisma },
        { provide: ConfigService, useValue: config },
      ],
    }).compile();

    const unconfigured = module.get(ServientregaCarrierRateProvider);
    const quote = await unconfigured.quote({
      destination: { country: 'EC', city: 'Quito' },
      subtotal: 20,
    });

    expect(quote.provider).toBe('servientrega-fallback');
    expect(quote.amount).toBe(5);
  });
});
