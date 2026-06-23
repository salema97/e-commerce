import { Injectable } from '@nestjs/common';
import { TaxCategory } from '@prisma/client';
import {
  TaxCalculator,
  TaxableLine,
  TaxLineResult,
} from './tax-calculator.interface.js';

const RATES: Record<TaxCategory, number> = {
  STANDARD: 0.15,
  REDUCED: 0.05,
  ZERO: 0,
  EXEMPT: 0,
};

@Injectable()
export class EcuadorIvaTaxCalculator extends TaxCalculator {
  calculateLineTax(line: TaxableLine): TaxLineResult {
    const taxRate = RATES[line.taxCategory] ?? RATES.STANDARD;
    const taxAmount = Number((Math.max(0, line.lineSubtotal) * taxRate).toFixed(2));
    return { taxRate, taxAmount };
  }
}
