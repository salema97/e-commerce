import { describe, it, expect } from 'vitest';
import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { TaxCategory } from '@prisma/client';
import { EcuadorIvaTaxCalculator } from './ecuador-iva.tax-calculator.js';
import { StripeTaxCalculator } from './stripe-tax.calculator.js';
import { TaxJarTaxCalculator } from './taxjar.tax-calculator.js';
import { AvalaraTaxCalculator } from './avalara.tax-calculator.js';
import { TaxService } from './tax.service.js';

describe('TaxService', () => {
  it('calculates Ecuador IVA with discount allocation', async () => {
    const module = await Test.createTestingModule({
      providers: [
        EcuadorIvaTaxCalculator,
        StripeTaxCalculator,
        TaxJarTaxCalculator,
        AvalaraTaxCalculator,
        TaxService,
        {
          provide: ConfigService,
          useValue: {
            get: (key: string) => (key === 'TAX_PROVIDER' ? 'ecuador' : undefined),
          },
        },
      ],
    }).compile();

    const taxService = module.get(TaxService);
    const result = await taxService.calculateForCart({
      items: [{ productId: 'p1', price: 50, quantity: 2 }],
      taxCategories: new Map([['p1', TaxCategory.STANDARD]]),
      orderDiscount: 10,
      country: 'EC',
    });

    expect(result.provider).toBe('ecuador');
    expect(result.taxAmount).toBe(13.5);
  });
});
