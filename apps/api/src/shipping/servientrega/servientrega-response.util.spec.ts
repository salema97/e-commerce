import { describe, expect, it } from 'vitest';
import {
  extractServientregaCities,
  extractServientregaTariffs,
  getCityId,
  getTariffAmount,
  isServientregaSuccess,
  normalizeLocationName,
} from './servientrega-response.util.js';

describe('servientrega-response.util', () => {
  it('detects success when code is 1', () => {
    expect(isServientregaSuccess({ code: 1 })).toBe(true);
    expect(isServientregaSuccess({ code: '1' })).toBe(true);
    expect(isServientregaSuccess({ code: 0 })).toBe(false);
    expect(isServientregaSuccess({ code: 97 })).toBe(false);
  });

  it('extracts tariffs from alternate payload shapes', () => {
    const tariffs = extractServientregaTariffs({
      code: 1,
      Tarifas: [{ ValorTotal: 12.5 }],
    });
    expect(tariffs).toHaveLength(1);
    expect(getTariffAmount(tariffs[0])).toBe(12.5);
  });

  it('extracts cities and ids', () => {
    const cities = extractServientregaCities({
      code: 1,
      Ciudades: [{ Id_Ciudad: 42, Nombre: 'Quito' }],
    });
    expect(cities).toHaveLength(1);
    expect(getCityId(cities[0])).toBe(42);
  });

  it('normalizes location names', () => {
    expect(normalizeLocationName('  Quito  ')).toBe('quito');
    expect(normalizeLocationName('Cuenca')).toBe('cuenca');
  });
});
