import type { Address } from '@repo/shared-types';

const ECUADOR_MOBILE_PREFIXES = ['099', '098', '097', '096', '095', '093', '092'];

export function isEcuadorMobilePhone(phone: string): boolean {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length !== 10) {
    return false;
  }
  return ECUADOR_MOBILE_PREFIXES.some((prefix) => cleaned.startsWith(prefix));
}

export function normalizeEcuadorPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');

  if (digits.length === 9 && digits.startsWith('9')) {
    return `+593${digits}`;
  }

  if (digits.length === 10 && digits.startsWith('0')) {
    return `+593${digits.slice(1)}`;
  }

  if (digits.length === 11 && digits.startsWith('593')) {
    return `+${digits}`;
  }

  if (digits.startsWith('+')) {
    return digits;
  }

  return phone;
}

export function isValidRuc(ruc: string): boolean {
  const cleaned = ruc.replace(/\D/g, '');

  if (cleaned.length !== 13) {
    return false;
  }

  const provinceCode = Number.parseInt(cleaned.slice(0, 2), 10);
  if (provinceCode < 1 || provinceCode > 24) {
    return false;
  }

  const thirdDigit = Number.parseInt(cleaned.charAt(2), 10);
  const lastThree = cleaned.slice(10, 13);

  if (thirdDigit === 9) {
    return validateJuridicaRuc(cleaned) && lastThree === '001';
  }

  if (thirdDigit === 6) {
    return validatePublicoRuc(cleaned) && lastThree === '001';
  }

  if (thirdDigit >= 0 && thirdDigit <= 5) {
    return validateCedula(cleaned.slice(0, 10)) && lastThree === '001';
  }

  return false;
}

function validateCedula(cedula: string): boolean {
  if (cedula.length !== 10) {
    return false;
  }

  const provinceCode = Number.parseInt(cedula.slice(0, 2), 10);
  if (provinceCode < 1 || provinceCode > 24) {
    return false;
  }

  const coefficients = [2, 1, 2, 1, 2, 1, 2, 1, 2];
  let sum = 0;

  for (let i = 0; i < 9; i++) {
    let value = Number.parseInt(cedula.charAt(i), 10) * coefficients[i];
    if (value >= 10) {
      value -= 9;
    }
    sum += value;
  }

  const verifier = Number.parseInt(cedula.charAt(9), 10);
  const nextTen = Math.ceil(sum / 10) * 10;
  const checkDigit = nextTen - sum === 10 ? 0 : nextTen - sum;

  return checkDigit === verifier;
}

function validateJuridicaRuc(ruc: string): boolean {
  const coefficients = [4, 3, 2, 7, 6, 5, 4, 3, 2];
  const digits = ruc.slice(0, 9).split('').map(Number);
  const verifier = Number.parseInt(ruc.charAt(9), 10);

  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += digits[i] * coefficients[i];
  }

  const remainder = sum % 11;
  const checkDigit = remainder === 0 ? 0 : 11 - remainder;

  return checkDigit === verifier;
}

function validatePublicoRuc(ruc: string): boolean {
  const coefficients = [3, 2, 7, 6, 5, 4, 3, 2];
  const digits = ruc.slice(0, 8).split('').map(Number);
  const verifier = Number.parseInt(ruc.charAt(8), 10);

  let sum = 0;
  for (let i = 0; i < 8; i++) {
    sum += digits[i] * coefficients[i];
  }

  const remainder = sum % 11;
  const checkDigit = remainder === 0 ? 0 : 11 - remainder;

  return checkDigit === verifier;
}

export function isValidEcuadorPhone(phone: string): boolean {
  const normalized = normalizeEcuadorPhone(phone);
  const digits = normalized.replace(/\D/g, '');
  return /^\+?5939\d{8}$/.test(normalized) || /^\+?593[2-7]\d{7}$/.test(normalized);
}

export function rucType(ruc: string): 'natural' | 'juridica' | 'publico' | 'unknown' {
  if (!isValidRuc(ruc)) {
    return 'unknown';
  }
  const cleaned = ruc.replace(/\D/g, '');
  const thirdDigit = Number.parseInt(cleaned.charAt(2), 10);

  if (thirdDigit === 9) return 'juridica';
  if (thirdDigit === 6) return 'publico';
  return 'natural';
}

export function validateAddress(address: Partial<Address>): string[] {
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

  if (address.phone && !isValidEcuadorPhone(address.phone)) {
    errors.push('Invalid Ecuador phone number');
  }

  return errors;
}
