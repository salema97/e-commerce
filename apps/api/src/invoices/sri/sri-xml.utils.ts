export type SriYesNo = 'SI' | 'NO';

export function formatSriYesNo(value: boolean): SriYesNo {
  return value ? 'SI' : 'NO';
}

export function parseBooleanEnv(
  value: string | undefined,
  defaultValue: boolean,
): boolean {
  if (value === undefined || value.trim() === '') {
    return defaultValue;
  }

  const normalized = value.trim().toLowerCase();
  if (['true', '1', 'yes', 'si', 'sí'].includes(normalized)) {
    return true;
  }
  if (['false', '0', 'no'].includes(normalized)) {
    return false;
  }

  return defaultValue;
}

export function resolveEmissionDate(accessKey: string, fallback?: Date): Date {
  if (accessKey.length >= 8) {
    const day = Number.parseInt(accessKey.slice(0, 2), 10);
    const month = Number.parseInt(accessKey.slice(2, 4), 10) - 1;
    const year = Number.parseInt(accessKey.slice(4, 8), 10);
    const parsed = new Date(year, month, day);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }
  }

  return fallback ?? new Date();
}

export function formatSriDate(date: Date): string {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

export function resolveBuyerIdentificationType(identification?: string): string {
  if (!identification) return '07';
  if (identification.length === 10) return '05';
  if (identification.length === 13 && identification.endsWith('001')) return '04';
  return '06';
}

export function formatSriAmount(value: number): string {
  return value.toFixed(2);
}

export function formatSriQuantity(value: number): string {
  return value.toFixed(2);
}

export function formatSriCurrency(currency: string): string {
  return currency.toUpperCase() === 'USD' ? 'DOLAR' : currency.toUpperCase();
}

export function buildAdditionalInfoFields(
  entries: Array<{ name: string; value?: string }>,
): unknown | undefined {
  const fields = entries
    .filter((entry): entry is { name: string; value: string } =>
      Boolean(entry.value?.trim()),
    )
    .map((entry) => ({ '@_nombre': entry.name, '#text': entry.value }));

  if (fields.length === 0) {
    return undefined;
  }

  return {
    campoAdicional: fields.length === 1 ? fields[0] : fields,
  };
}
