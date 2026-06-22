const DEFAULT_LOCALE = 'es-EC';
const DEFAULT_TIMEZONE = 'America/Guayaquil';

export interface FormatDateOptions {
  locale?: string;
  timezone?: string;
  dateStyle?: 'full' | 'long' | 'medium' | 'short';
  timeStyle?: 'full' | 'long' | 'medium' | 'short';
}

export function formatDate(
  value: string | number | Date | null | undefined,
  options: FormatDateOptions = {},
): string {
  const {
    locale = DEFAULT_LOCALE,
    timezone = DEFAULT_TIMEZONE,
    dateStyle = 'medium',
    timeStyle,
  } = options;

  if (value === null || value === undefined) {
    return '-';
  }

  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '-';
  }

  return new Intl.DateTimeFormat(locale, {
    dateStyle,
    timeStyle,
    timeZone: timezone,
  }).format(date);
}

export function formatDateTime(
  value: string | number | Date | null | undefined,
  options: FormatDateOptions = {},
): string {
  return formatDate(value, { dateStyle: 'short', timeStyle: 'short', ...options });
}

export function formatRelativeDate(
  value: string | number | Date | null | undefined,
  locale = DEFAULT_LOCALE,
): string {
  if (value === null || value === undefined) {
    return '-';
  }

  const date = value instanceof Date ? value : new Date(value);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });

  if (Math.abs(diffSeconds) < 60) return rtf.format(-diffSeconds, 'second');
  if (Math.abs(diffMinutes) < 60) return rtf.format(-diffMinutes, 'minute');
  if (Math.abs(diffHours) < 24) return rtf.format(-diffHours, 'hour');
  if (Math.abs(diffDays) < 30) return rtf.format(-diffDays, 'day');

  return formatDate(value, { dateStyle: 'medium' });
}

export function startOfDay(date: Date): Date {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

export function endOfDay(date: Date): Date {
  const result = new Date(date);
  result.setHours(23, 59, 59, 999);
  return result;
}
