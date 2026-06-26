import {
  DEFAULT_FREE_SHIPPING_THRESHOLD,
  DEFAULT_SHIPPING_FLAT_RATE,
  ECUADOR_IVA_RATE,
} from './constants.js';

export type CheckoutTotalsEstimate = {
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
};

/** Client-side checkout estimate aligned with platform defaults (API quote preferred when available). */
export function estimateCheckoutTotals(subtotal: number): CheckoutTotalsEstimate {
  const shipping =
    subtotal >= DEFAULT_FREE_SHIPPING_THRESHOLD ? 0 : DEFAULT_SHIPPING_FLAT_RATE;
  const tax = Number((subtotal * ECUADOR_IVA_RATE).toFixed(2));
  const total = Number((subtotal + shipping + tax).toFixed(2));
  return { subtotal, shipping, tax, total };
}
