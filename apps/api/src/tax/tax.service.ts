import { Inject, Injectable } from '@nestjs/common';
import { TaxCategory } from '@prisma/client';
import { TaxCalculator, TaxableLine } from './tax-calculator.interface.js';
import type { CartItemInput } from '../promotions/promotion.service.js';

export interface CartTaxInput {
  items: CartItemInput[];
  taxCategories: Map<string, TaxCategory>;
  orderDiscount: number;
}

export interface CartTaxResult {
  taxAmount: number;
  lines: Array<{
    productId: string;
    lineSubtotal: number;
    taxRate: number;
    taxAmount: number;
  }>;
}

@Injectable()
export class TaxService {
  constructor(@Inject(TaxCalculator) private readonly calculator: TaxCalculator) {}

  calculateForCart(input: CartTaxInput): CartTaxResult {
    const lineSubtotals = input.items.map((item) => ({
      productId: item.productId,
      lineSubtotal: Number((item.price * item.quantity).toFixed(2)),
      taxCategory: input.taxCategories.get(item.productId) ?? TaxCategory.STANDARD,
    }));

    const subtotal = lineSubtotals.reduce((sum, line) => sum + line.lineSubtotal, 0);
    let remainingDiscount = Number(input.orderDiscount.toFixed(2));

    const taxableLines: TaxableLine[] = lineSubtotals.map((line, index) => {
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

    const orderTax = this.calculator.calculateOrderTax(taxableLines);

    return {
      taxAmount: orderTax.taxAmount,
      lines: lineSubtotals.map((line, index) => ({
        productId: line.productId,
        lineSubtotal: line.lineSubtotal,
        taxRate: orderTax.lines[index].taxRate,
        taxAmount: orderTax.lines[index].taxAmount,
      })),
    };
  }
}
