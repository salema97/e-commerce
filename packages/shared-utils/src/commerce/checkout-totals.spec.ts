import { describe, it, expect } from 'vitest';
import { estimateCheckoutTotals } from './checkout-totals.js';

describe('estimateCheckoutTotals', () => {
  it('applies flat shipping below free threshold', () => {
    expect(estimateCheckoutTotals(40)).toEqual({
      subtotal: 40,
      shipping: 5,
      tax: 6,
      total: 51,
    });
  });

  it('waives shipping at or above threshold', () => {
    expect(estimateCheckoutTotals(50).shipping).toBe(0);
  });
});
