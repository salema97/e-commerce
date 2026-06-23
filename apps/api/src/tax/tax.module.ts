import { Module } from '@nestjs/common';
import { TaxCalculator } from './tax-calculator.interface.js';
import { EcuadorIvaTaxCalculator } from './ecuador-iva.tax-calculator.js';
import { TaxService } from './tax.service.js';

@Module({
  providers: [
    EcuadorIvaTaxCalculator,
    { provide: TaxCalculator, useExisting: EcuadorIvaTaxCalculator },
    TaxService,
  ],
  exports: [TaxService, TaxCalculator],
})
export class TaxModule {}
