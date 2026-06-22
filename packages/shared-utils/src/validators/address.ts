import type { Address } from '@repo/shared-types';

export function validateAddressFields(address: Partial<Address>): string[] {
  const errors: string[] = [];

  if (!address.recipientName || address.recipientName.trim().length < 2) {
    errors.push('Recipient name is required');
  }

  if (!address.street || address.street.trim().length < 3) {
    errors.push('Street address is required');
  }

  if (!address.city || address.city.trim().length < 2) {
    errors.push('City is required');
  }

  if (!address.country || address.country.trim().length < 2) {
    errors.push('Country is required');
  }

  return errors;
}

export function isEcuadorAddress(address: Pick<Address, 'country'>): boolean {
  return address.country?.toLowerCase() === 'ecuador';
}
