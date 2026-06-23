import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TaxCategory } from '@prisma/client';
import { TaxCalculator, TaxableLine, TaxLineResult } from './tax-calculator.interface.js';
import { EcuadorIvaTaxCalculator } from './ecuador-iva.tax-calculator.js';

export interface TaxJurisdictionContext {
  country?: string;
  province?: string;
}

@Injectable()
export class TaxJarTaxCalculator extends TaxCalculator {
  constructor(
    private readonly config: ConfigService,
    private readonly ecuadorCalculator: EcuadorIvaTaxCalculator,
  ) {
    super();
  }

  calculateLineTax(line: TaxableLine): TaxLineResult {
    return this.ecuadorCalculator.calculateLineTax(line);
  }

  async calculateWithJurisdiction(
    lines: TaxableLine[],
    context: TaxJurisdictionContext,
  ): Promise<{ taxAmount: number; lines: TaxLineResult[] }> {
    const apiKey = this.config.get<string>('TAXJAR_API_KEY');
    const country = context.country?.toUpperCase();

    if (!apiKey || country === 'EC' || country === 'ECUADOR') {
      return this.calculateOrderTax(lines);
    }

    try {
      const subtotal = lines.reduce((sum, line) => sum + line.lineSubtotal, 0);
      const response = await fetch('https://api.taxjar.com/v2/taxes', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from_country: 'EC',
          to_country: country,
          to_state: context.province,
          amount: subtotal,
          shipping: 0,
        }),
      });

      if (!response.ok) {
        throw new Error(`TaxJar failed: ${response.status}`);
      }

      const payload = (await response.json()) as {
        tax: { amount_to_collect: number; rate: number };
      };
      const taxAmount = Number(payload.tax.amount_to_collect.toFixed(2));
      const taxRate = payload.tax.rate;
      return {
        taxAmount,
        lines: lines.map((line) => ({
          taxRate,
          taxAmount: Number((line.lineSubtotal * taxRate).toFixed(2)),
        })),
      };
    } catch {
      return this.calculateOrderTax(lines);
    }
  }
}
