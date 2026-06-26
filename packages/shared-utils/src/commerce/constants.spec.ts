import { describe, it, expect } from 'vitest';
import {
  DEFAULT_FREE_SHIPPING_THRESHOLD,
  DEFAULT_SHIPPING_FLAT_RATE,
  ECUADOR_IVA_RATE,
} from './constants.js';

describe('commerce constants', () => {
  it('exports Ecuador checkout defaults', () => {
    expect(ECUADOR_IVA_RATE).toBe(0.15);
    expect(DEFAULT_FREE_SHIPPING_THRESHOLD).toBe(50);
    expect(DEFAULT_SHIPPING_FLAT_RATE).toBe(5);
  });
});
