import { describe, it, expect } from 'vitest';
import {
  isValidCedula,
  isValidRuc,
  isValidEcuadorCustomerIdentification,
} from './ecuador.js';

describe('Ecuador identification validators', () => {
  describe('isValidCedula', () => {
    it('accepts a valid 10-digit cédula', () => {
      expect(isValidCedula('1710034065')).toBe(true);
    });

    it('rejects invalid cédulas', () => {
      expect(isValidCedula('1710034066')).toBe(false);
      expect(isValidCedula('1234567890')).toBe(false);
    });

    it('rejects non-10-digit values', () => {
      expect(isValidCedula('171003406')).toBe(false);
      expect(isValidCedula('1710034065001')).toBe(false);
    });
  });

  describe('isValidEcuadorCustomerIdentification', () => {
    it('accepts valid cédulas', () => {
      expect(isValidEcuadorCustomerIdentification('1710034065')).toBe(true);
    });

    it('accepts valid RUCs', () => {
      expect(isValidEcuadorCustomerIdentification('1792146739001')).toBe(true);
      expect(isValidEcuadorCustomerIdentification('1710034065001')).toBe(true);
    });

    it('accepts consumidor final', () => {
      expect(isValidEcuadorCustomerIdentification('9999999999999')).toBe(true);
    });

    it('rejects invalid or malformed IDs', () => {
      expect(isValidEcuadorCustomerIdentification('123456789')).toBe(false);
      expect(isValidEcuadorCustomerIdentification('1234567890123')).toBe(false);
      expect(isValidEcuadorCustomerIdentification('')).toBe(false);
    });
  });
});
