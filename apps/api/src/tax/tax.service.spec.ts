import { describe, it, expect } from 'vitest';
import { TaxCategory } from '@prisma/client';
import { EcuadorIvaTaxCalculator } from './ecuador-iva.tax-calculator.js';
import { TaxService } from './tax.service.js';
import { TaxCalculator } from './tax-calculator.interface.js';

describe('EcuadorIvaTaxCalculator', () => {
  const calculator = new EcuadorIvaTaxCalculator();

  it('applies 15% IVA for STANDARD', () => {
    const result = calculator.calculateLineTax({ lineSubtotal: 100, taxCategory: TaxCategory.STANDARD });
    expect(result.taxRate).toBe(0.15);
    expect(result.taxAmount).toBe(15);
  });

  it('applies zero tax for EXEMPT', () => {
    const result = calculator.calculateLineTax({ lineSubtotal: 100, taxCategory: TaxCategory.EXEMPT });
    expect(result.taxAmount).toBe(0);
  });
});

describe('TaxService', () => {
  const taxService = new TaxService(new EcuadorIvaTaxCalculator() as TaxCalculator);

  it('allocates discount before computing tax', () => {
    const result = taxService.calculateForCart({
      items: [{ productId: 'p1', price: 50, quantity: 2 }],
      taxCategories: new Map([['p1', TaxCategory.STANDARD]]),
      orderDiscount: 10,
    });
    expect(result.taxAmount).toBe(13.5);
  });
});
