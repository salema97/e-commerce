import { Module } from '@nestjs/common';
import { TaxCalculator } from './tax-calculator.interface.js';
import { EcuadorIvaTaxCalculator } from './ecuador-iva.tax-calculator.js';
import { StripeTaxCalculator } from './stripe-tax.calculator.js';
import { TaxJarTaxCalculator } from './taxjar.tax-calculator.js';
import { AvalaraTaxCalculator } from './avalara.tax-calculator.js';
import { TaxService } from './tax.service.js';

@Module({
  providers: [
    EcuadorIvaTaxCalculator,
    StripeTaxCalculator,
    TaxJarTaxCalculator,
    AvalaraTaxCalculator,
    { provide: TaxCalculator, useExisting: EcuadorIvaTaxCalculator },
    TaxService,
  ],
  exports: [TaxService],
})
export class TaxModule {}
