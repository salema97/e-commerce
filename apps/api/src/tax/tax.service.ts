import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TaxCategory } from '@prisma/client';
import { EcuadorIvaTaxCalculator } from './ecuador-iva.tax-calculator.js';
import { StripeTaxCalculator } from './stripe-tax.calculator.js';
import { TaxJarTaxCalculator } from './taxjar.tax-calculator.js';
import { AvalaraTaxCalculator } from './avalara.tax-calculator.js';
import type { CartItemInput } from '../promotions/promotion.service.js';

export type TaxProviderName = 'ecuador' | 'stripe_tax' | 'taxjar' | 'avalara' | 'composite';

export interface CartTaxInput {
  items: CartItemInput[];
  taxCategories: Map<string, TaxCategory>;
  orderDiscount: number;
  country?: string;
  province?: string;
  currency?: string;
}

export interface CartTaxResult {
  taxAmount: number;
  provider: string;
  lines: Array<{
    productId: string;
    lineSubtotal: number;
    taxRate: number;
    taxAmount: number;
  }>;
}

@Injectable()
export class TaxService {
  constructor(
    private readonly config: ConfigService,
    private readonly ecuadorCalculator: EcuadorIvaTaxCalculator,
    private readonly stripeTaxCalculator: StripeTaxCalculator,
    private readonly taxJarCalculator: TaxJarTaxCalculator,
    private readonly avalaraCalculator: AvalaraTaxCalculator,
  ) {}

  async calculateForCart(input: CartTaxInput): Promise<CartTaxResult> {
    const lineSubtotals = input.items.map((item) => ({
      productId: item.productId,
      lineSubtotal: Number((item.price * item.quantity).toFixed(2)),
      taxCategory: input.taxCategories.get(item.productId) ?? TaxCategory.STANDARD,
    }));

    const subtotal = lineSubtotals.reduce((sum, line) => sum + line.lineSubtotal, 0);
    let remainingDiscount = Number(input.orderDiscount.toFixed(2));

    const taxableLines = lineSubtotals.map((line, index) => {
      const isLast = index === lineSubtotals.length - 1;
      const lineDiscount = isLast
        ? remainingDiscount
        : subtotal > 0
          ? Number(((line.lineSubtotal / subtotal) * input.orderDiscount).toFixed(2))
          : 0;
      remainingDiscount = Number((remainingDiscount - lineDiscount).toFixed(2));
      return {
        lineSubtotal: Number((line.lineSubtotal - lineDiscount).toFixed(2)),
        taxCategory: line.taxCategory,
      };
    });

    const provider = this.resolveProviderName(input.country);
    const orderTax = await this.calculateWithProvider(provider, taxableLines, input);

    return {
      taxAmount: orderTax.taxAmount,
      provider,
      lines: lineSubtotals.map((line, index) => ({
        productId: line.productId,
        lineSubtotal: line.lineSubtotal,
        taxRate: orderTax.lines[index].taxRate,
        taxAmount: orderTax.lines[index].taxAmount,
      })),
    };
  }

  private resolveProviderName(country?: string): TaxProviderName {
    const configured = this.config.get<string>('TAX_PROVIDER')?.toLowerCase() as
      | TaxProviderName
      | undefined;
    if (configured && configured !== 'composite') {
      return configured;
    }

    const normalized = country?.toUpperCase();
    if (!normalized || normalized === 'EC' || normalized === 'ECUADOR') {
      return 'ecuador';
    }

    const international = this.config.get<string>('INTERNATIONAL_TAX_PROVIDER')?.toLowerCase() as
      | TaxProviderName
      | undefined;
    return international ?? 'stripe_tax';
  }

  private async calculateWithProvider(
    provider: TaxProviderName,
    lines: Array<{ lineSubtotal: number; taxCategory: TaxCategory }>,
    input: CartTaxInput,
  ) {
    const context = {
      country: input.country,
      province: input.province,
      currency: input.currency,
    };

    switch (provider) {
      case 'stripe_tax':
        return this.stripeTaxCalculator.calculateWithJurisdiction(lines, context);
      case 'taxjar':
        return this.taxJarCalculator.calculateWithJurisdiction(lines, context);
      case 'avalara':
        return this.avalaraCalculator.calculateOrderTax(lines);
      case 'ecuador':
      default:
        return this.ecuadorCalculator.calculateOrderTax(lines);
    }
  }
}
