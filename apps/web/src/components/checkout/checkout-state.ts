import type { CreatedOrderResult, PaymentIntentResult, ShippingMethodType, ShippingQuote } from '@repo/shared-types';
import { EMPTY_ADDRESS, type AddressFormValues } from './address-form.utils';

export type CheckoutState = {
  address: AddressFormValues;
  couponCode: string;
  referralCode: string;
  loyaltyPoints: number;
  order: CreatedOrderResult | null;
  paymentIntent: PaymentIntentResult | null;
  isSubmitting: boolean;
  error: string | null;
  shippingQuote: ShippingQuote | null;
  shippingMethod: ShippingMethodType;
  pickupLocationId: string;
};

export type CheckoutAction =
  | { type: 'set_address'; value: AddressFormValues }
  | { type: 'set_coupon'; value: string }
  | { type: 'set_referral'; value: string }
  | { type: 'set_loyalty'; value: number }
  | { type: 'submit_start' }
  | { type: 'submit_success'; order: CreatedOrderResult; paymentIntent: PaymentIntentResult }
  | { type: 'submit_error'; message: string }
  | { type: 'set_shipping_quote'; quote: ShippingQuote | null }
  | { type: 'set_shipping_method'; value: ShippingMethodType }
  | { type: 'set_pickup_location'; value: string };

export const checkoutInitialState: CheckoutState = {
  address: EMPTY_ADDRESS,
  couponCode: '',
  referralCode: '',
  loyaltyPoints: 0,
  order: null,
  paymentIntent: null,
  isSubmitting: false,
  error: null,
  shippingQuote: null,
  shippingMethod: 'DELIVERY',
  pickupLocationId: '',
};

export function createInitialCheckoutState(): CheckoutState {
  if (typeof window === 'undefined') {
    return checkoutInitialState;
  }

  const ref = new URLSearchParams(window.location.search).get('ref');
  if (!ref) {
    return checkoutInitialState;
  }

  return {
    ...checkoutInitialState,
    referralCode: ref.toUpperCase(),
  };
}

export function checkoutReducer(state: CheckoutState, action: CheckoutAction): CheckoutState {
  switch (action.type) {
    case 'set_address':
      return { ...state, address: action.value };
    case 'set_coupon':
      return { ...state, couponCode: action.value };
    case 'set_referral':
      return { ...state, referralCode: action.value };
    case 'set_loyalty':
      return { ...state, loyaltyPoints: action.value };
    case 'submit_start':
      return { ...state, error: null, isSubmitting: true };
    case 'submit_success':
      return {
        ...state,
        order: action.order,
        paymentIntent: action.paymentIntent,
        isSubmitting: false,
      };
    case 'submit_error':
      return { ...state, error: action.message, isSubmitting: false };
    case 'set_shipping_quote':
      return { ...state, shippingQuote: action.quote };
    case 'set_shipping_method':
      return { ...state, shippingMethod: action.value };
    case 'set_pickup_location':
      return { ...state, pickupLocationId: action.value };
    default:
      return state;
  }
}
