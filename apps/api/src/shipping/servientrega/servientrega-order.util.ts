import type { OrderAddress } from '@repo/shared-types';

export function parseOrderShippingAddress(value: unknown): OrderAddress | null {
  if (!value || typeof value !== 'object') return null;
  const record = value as Record<string, unknown>;
  const recipientName = String(record.recipientName ?? '').trim();
  const street = String(record.street ?? '').trim();
  const city = String(record.city ?? '').trim();
  const country = String(record.country ?? 'EC').trim();
  if (!recipientName || !street || !city) return null;

  return {
    recipientName,
    street,
    city,
    country,
    state: record.state ? String(record.state) : undefined,
    zipCode: record.zipCode ? String(record.zipCode) : undefined,
    phone: record.phone ? String(record.phone) : undefined,
  };
}

export function buildServientregaTrackingUrl(
  guideNumber: string,
  baseUrl = 'https://www.servientrega.com.ec/Tracking/',
): string {
  const url = new URL(baseUrl);
  url.searchParams.set('guia', guideNumber);
  url.searchParams.set('tipo', 'GUIA');
  return url.toString();
}
