import type { OrderAddress } from '@repo/shared-types';

export interface AddressFormValues {
  email: string;
  phone: string;
  recipientName: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  notes: string;
}

export const EMPTY_ADDRESS: AddressFormValues = {
  email: '',
  phone: '',
  recipientName: '',
  street: '',
  city: '',
  state: '',
  zipCode: '',
  country: 'Ecuador',
  notes: '',
};

export function isAddressValid(values: AddressFormValues): boolean {
  return Boolean(values.email && values.recipientName && values.street && values.city && values.country);
}

export function toOrderAddress(values: AddressFormValues): OrderAddress {
  return {
    recipientName: values.recipientName,
    street: values.street,
    city: values.city,
    state: values.state || undefined,
    country: values.country,
    zipCode: values.zipCode || undefined,
    phone: values.phone || undefined,
  };
}
