export interface FormatPercentageOptions {
  decimals?: number;
  locale?: string;
}

export function formatPercentage(
  value: number | string | null | undefined,
  options: FormatPercentageOptions = {},
): string {
  const { decimals = 2, locale = 'es-EC' } = options;

  if (value === null || value === undefined) {
    return '-';
  }

  const numericValue = typeof value === 'string' ? Number.parseFloat(value) : value;

  if (Number.isNaN(numericValue)) {
    return '-';
  }

  return new Intl.NumberFormat(locale, {
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(numericValue);
}

export function percentageOf(part: number, total: number): number {
  if (total === 0) {
    return 0;
  }
  return part / total;
}

export function discountPercentage(original: number, discounted: number): number {
  if (original === 0 || discounted > original) {
    return 0;
  }
  return (original - discounted) / original;
}
