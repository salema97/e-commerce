import { Injectable } from '@nestjs/common';
import { TaxCalculator, TaxableLine, TaxLineResult } from './tax-calculator.interface.js';
import { EcuadorIvaTaxCalculator } from './ecuador-iva.tax-calculator.js';

/** Avalara adapter stub — delegates to Ecuador IVA until full AvaTax credentials are configured. */
@Injectable()
export class AvalaraTaxCalculator extends TaxCalculator {
  constructor(private readonly ecuadorCalculator: EcuadorIvaTaxCalculator) {
    super();
  }

  calculateLineTax(line: TaxableLine): TaxLineResult {
    return this.ecuadorCalculator.calculateLineTax(line);
  }
}
