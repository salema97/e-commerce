import type { OrderStatus, PaymentStatus, RefundStatus } from '@repo/shared-types';

const DEFAULT_CURRENCY = 'USD';
const DEFAULT_LOCALE = 'es-EC';

export interface FormatPriceOptions {
  currency?: string;
  locale?: string;
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
}

export function formatPrice(
  value: number | string | null | undefined,
  options: FormatPriceOptions = {},
): string {
  const {
    currency = DEFAULT_CURRENCY,
    locale = DEFAULT_LOCALE,
    minimumFractionDigits = 2,
    maximumFractionDigits = 2,
  } = options;

  if (value === null || value === undefined || value === '') {
    return '-';
  }

  const numericValue = typeof value === 'string' ? Number.parseFloat(value) : value;

  if (Number.isNaN(numericValue)) {
    return '-';
  }

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits,
    maximumFractionDigits,
  }).format(numericValue);
}

export function formatPriceWithoutCurrency(
  value: number | string | null | undefined,
  options: Omit<FormatPriceOptions, 'currency'> = {},
): string {
  const formatted = formatPrice(value, { ...options, currency: 'USD' });
  return formatted.replace(/[^0-9,.\-]/g, '');
}

export function orderStatusLabel(status: OrderStatus): string {
  const labels: Record<OrderStatus, string> = {
    PENDING: 'Pending',
    PAYMENT_PENDING: 'Payment pending',
    PAYMENT_FAILED: 'Payment failed',
    PROCESSING: 'Processing',
    SHIPPED: 'Shipped',
    DELIVERED: 'Delivered',
    CANCELLED: 'Cancelled',
    REFUNDED: 'Refunded',
    PARTIALLY_REFUNDED: 'Partially refunded',
  };
  return labels[status] ?? status;
}

export function paymentStatusLabel(status: PaymentStatus): string {
  const labels: Record<PaymentStatus, string> = {
    PENDING: 'Pending',
    COMPLETED: 'Paid',
    FAILED: 'Failed',
    REFUNDED: 'Refunded',
  };
  return labels[status] ?? status;
}

export function refundStatusLabel(status: RefundStatus): string {
  const labels: Record<RefundStatus, string> = {
    PENDING: 'Pending',
    COMPLETED: 'Completed',
    REJECTED: 'Rejected',
  };
  return labels[status] ?? status;
}
