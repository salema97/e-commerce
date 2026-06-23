import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import { ShippingZoneType } from '@prisma/client';
import { ShippingService } from './shipping.service.js';
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
    {
      id: '2',
      name: 'Galápagos',
      code: 'EC-GALAPAGOS',
      zoneType: ShippingZoneType.EXCLUDED,
      provinces: ['Galápagos'],
      baseRate: new Prisma.Decimal(15),
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: '3',
      name: 'Internacional',
      code: 'INTL',
      zoneType: ShippingZoneType.INTERNATIONAL,
      provinces: [],
      baseRate: new Prisma.Decimal(25),
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  beforeEach(async () => {
    const prisma = {
      shippingZone: {
        findMany: vi.fn().mockResolvedValue(zones),
      },
    };
    const module = await Test.createTestingModule({
      providers: [
        ShippingService,
        { provide: PrismaService, useValue: prisma },
        {
          provide: ConfigService,
          useValue: { get: vi.fn((key: string) => (key === 'SHIPPING_FREE_THRESHOLD' ? 50 : 5)) },
        },
      ],
    }).compile();
    service = module.get(ShippingService);
  });

  it('quotes domestic flat rate', async () => {
    const quote = await service.quote({ country: 'EC', province: 'Pichincha', subtotal: 20 });
    expect(quote.amount).toBe(5);
    expect(quote.zoneCode).toBe('EC-DOMESTIC');
  });

  it('applies free shipping above threshold', async () => {
    const quote = await service.quote({ country: 'EC', subtotal: 60 });
    expect(quote.amount).toBe(0);
    expect(quote.freeShippingApplied).toBe(true);
  });

  it('uses excluded zone rate for Galápagos', async () => {
    const quote = await service.quote({ country: 'EC', province: 'Galápagos', subtotal: 20 });
    expect(quote.amount).toBe(15);
    expect(quote.zoneCode).toBe('EC-GALAPAGOS');
  });

  it('quotes international rate for non-EC country', async () => {
    const quote = await service.quote({ country: 'US', subtotal: 20 });
    expect(quote.amount).toBe(25);
    expect(quote.zoneCode).toBe('INTL');
  });
});
