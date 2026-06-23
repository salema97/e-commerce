import { describe, it, expect, vi, beforeEach } from 'vitest';
import { randomInt } from 'node:crypto';
import { SriAccessKeyBuilder } from './sri-access-key.builder.js';

vi.mock('node:crypto', () => ({
  randomInt: vi.fn(),
}));

describe('SriAccessKeyBuilder', () => {
  const builder = new SriAccessKeyBuilder();
  const randomIntMock = vi.mocked(randomInt);

  beforeEach(() => {
    vi.clearAllMocks();
    randomIntMock.mockReturnValue(0);
  });

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
    const checkDigit = builder.computeModulo11(
      '1501202401017921467390011001001001000000001000000001',
    );
    expect(checkDigit).toMatch(/^[0-9]$/);
  });

  it('returns 0 when modulo 11 remainder is zero', () => {
    expect(builder.computeModulo11('0')).not.toBe('11');
  });

  it('generates unique numeric codes using a cryptographic random source', () => {
    randomIntMock.mockReturnValueOnce(0).mockReturnValueOnce(1);

    const first = builder.build({
      date: new Date(2024, 0, 15),
      documentType: '01',
      ruc: '1792146739001',
      environment: '1',
      establishmentCode: '001',
      emissionPointCode: '001',
      sequenceNumber: '000000001',
    });

    const second = builder.build({
      date: new Date(2024, 0, 15),
      documentType: '01',
      ruc: '1792146739001',
      environment: '1',
      establishmentCode: '001',
      emissionPointCode: '001',
      sequenceNumber: '000000001',
    });

    expect(first).not.toBe(second);
    expect(randomIntMock).toHaveBeenCalledWith(0, 100_000_000);
  });

  it('produces no duplicate access keys when numeric codes are unique', () => {
    let counter = 0;
    randomIntMock.mockImplementation(() => counter++);

    const keys = new Set(
      Array.from({ length: 100 }, () =>
        builder.build({
          date: new Date(2024, 0, 15),
          documentType: '01',
          ruc: '1792146739001',
          environment: '1',
          establishmentCode: '001',
          emissionPointCode: '001',
          sequenceNumber: '000000001',
        }),
      ),
    );

    expect(keys.size).toBe(100);
  });

  it('throws when the date is invalid', () => {
    expect(() =>
      builder.build({
        date: new Date('invalid'),
        documentType: '01',
        ruc: '1792146739001',
        environment: '1',
        establishmentCode: '001',
        emissionPointCode: '001',
        sequenceNumber: '000000001',
      }),
    ).toThrow('Invalid date');
  });

  it('throws when the RUC is not 13 digits', () => {
    expect(() =>
      builder.build({
        date: new Date(2024, 0, 15),
        documentType: '01',
        ruc: '123',
        environment: '1',
        establishmentCode: '001',
        emissionPointCode: '001',
        sequenceNumber: '000000001',
      }),
    ).toThrow('ruc must be a 13-digit numeric string');
  });

  it('throws when the environment is invalid', () => {
    expect(() =>
      builder.build({
        date: new Date(2024, 0, 15),
        documentType: '01',
        ruc: '1792146739001',
        environment: '3' as '1',
        establishmentCode: '001',
        emissionPointCode: '001',
        sequenceNumber: '000000001',
      }),
    ).toThrow('environment must be');
  });
});
