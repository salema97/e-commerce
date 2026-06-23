import { TaxCategory } from '@prisma/client';

export interface TaxableLine {
  lineSubtotal: number;
  taxCategory: TaxCategory;
}

export interface TaxLineResult {
  taxRate: number;
  taxAmount: number;
}

export interface OrderTaxResult {
  taxAmount: number;
  lines: TaxLineResult[];
}

export abstract class TaxCalculator {
  abstract calculateLineTax(line: TaxableLine): TaxLineResult;

  calculateOrderTax(lines: TaxableLine[]): OrderTaxResult {
    const results = lines.map((line) => this.calculateLineTax(line));
    const taxAmount = Number(
      results.reduce((sum, line) => sum + line.taxAmount, 0).toFixed(2),
    );
    return { taxAmount, lines: results };
  }
}
