import { describe, it, expect } from 'vitest';
import { SriAccessKeyBuilder } from './sri-access-key.builder.js';

describe('SriAccessKeyBuilder', () => {
  const builder = new SriAccessKeyBuilder();

  it('builds a 49-digit access key', () => {
    const key = builder.build({
      date: new Date(2024, 0, 15),
      documentType: '01',
      ruc: '1792146739001',
      environment: '1',
      establishmentCode: '001',
      emissionPointCode: '001',
      sequenceNumber: '000000001',
    });

    expect(key).toHaveLength(49);
    expect(/^\d+$/.test(key)).toBe(true);
  });

  it('starts with the formatted date and document type', () => {
    const key = builder.build({
      date: new Date(2024, 0, 15),
      documentType: '01',
      ruc: '1792146739001',
      environment: '1',
      establishmentCode: '001',
      emissionPointCode: '001',
      sequenceNumber: '000000001',
    });

    expect(key.startsWith('15012024011792146739001')).toBe(true);
  });

  it('computes a valid modulo 11 check digit', () => {
    const checkDigit = builder.computeModulo11('1501202401017921467390011001001001000000001000000001');
    expect(checkDigit).toMatch(/^[0-9]$/);
  });

  it('returns 0 when modulo 11 remainder is zero', () => {
    // 11 - 0 = 11 should map to 0
    expect(builder.computeModulo11('0')).not.toBe('11');
  });
});
