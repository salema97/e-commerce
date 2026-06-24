import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { TaxCalculator, TaxableLine, TaxLineResult } from './tax-calculator.interface.js';
import { EcuadorIvaTaxCalculator } from './ecuador-iva.tax-calculator.js';

export interface StripeTaxContext {
  country?: string;
  province?: string;
  currency?: string;
}

@Injectable()
export class StripeTaxCalculator extends TaxCalculator {
  private readonly logger = new Logger(StripeTaxCalculator.name);
  private readonly stripe: Stripe | null;

  constructor(
    private readonly config: ConfigService,
    private readonly ecuadorCalculator: EcuadorIvaTaxCalculator,
  ) {
    super();
    const secret = this.config.get<string>('STRIPE_SECRET_KEY');
    this.stripe = secret ? new Stripe(secret) : null;
  }

  calculateLineTax(line: TaxableLine): TaxLineResult {
    return this.ecuadorCalculator.calculateLineTax(line);
  }

  async calculateWithJurisdiction(
    lines: TaxableLine[],
    context: StripeTaxContext,
  ): Promise<{ taxAmount: number; lines: TaxLineResult[] }> {
    const country = context.country?.toUpperCase();
    const enabled = this.config.get('STRIPE_TAX_ENABLED') === 'true';

    if (!enabled || !this.stripe || country === 'EC' || country === 'ECUADOR') {
      return this.calculateOrderTax(lines);
    }

    try {
      const currency = (context.currency ?? 'usd').toLowerCase();
      const lineItems = lines.map((line) => ({
        amount: Math.round(line.lineSubtotal * 100),
        reference: line.taxCategory,
        tax_code: this.mapTaxCode(line.taxCategory),
      }));

      const calculation = await this.stripe.tax.calculations.create({
        currency,
        customer_details: {
          address: {
            country: country ?? 'US',
            state: context.province,
          },
          address_source: 'shipping',
        },
        line_items: lineItems,
      });

      const taxAmount = Number(((calculation.tax_amount_exclusive ?? 0) / 100).toFixed(2));
      const effectiveRate =
        lines.reduce((sum, line) => sum + line.lineSubtotal, 0) > 0
          ? taxAmount / lines.reduce((sum, line) => sum + line.lineSubtotal, 0)
          : 0;

      return {
        taxAmount,
        lines: lines.map((line) => ({
          taxRate: effectiveRate,
          taxAmount: Number((line.lineSubtotal * effectiveRate).toFixed(2)),
        })),
      };
    } catch (error) {
      this.logger.warn({ error }, 'Stripe Tax calculation failed; using Ecuador IVA');
      return this.calculateOrderTax(lines);
    }
  }

  private mapTaxCode(category: TaxableLine['taxCategory']): string {
    switch (category) {
      case 'EXEMPT':
      case 'ZERO':
        return 'txcd_00000000';
      case 'REDUCED':
        return 'txcd_20030000';
      default:
        return 'txcd_99999999';
    }
  }
}
