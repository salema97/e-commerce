import { describe, it, expect } from 'vitest';
import { estimateCheckoutTotals } from '@repo/shared-utils';

describe('mobile checkout estimate', () => {
  it('matches shared checkout totals helper', () => {
    expect(estimateCheckoutTotals(100)).toEqual({
      subtotal: 100,
      shipping: 0,
      tax: 15,
      total: 115,
    });
  });
});
