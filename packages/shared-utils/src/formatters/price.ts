import type { OrderStatus, PaymentStatus, RefundStatus, ReturnStatus, RefundMethod } from '@repo/shared-types';

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
    PENDING: 'Pendiente',
    PAYMENT_PENDING: 'Pago pendiente',
    PAYMENT_FAILED: 'Pago fallido',
    PROCESSING: 'En proceso',
    SHIPPED: 'Enviado',
    DELIVERED: 'Entregado',
    CANCELLED: 'Cancelado',
    REFUNDED: 'Reembolsado',
    PARTIALLY_REFUNDED: 'Reembolso parcial',
  };
  return labels[status] ?? status;
}

export function paymentStatusLabel(status: PaymentStatus): string {
  const labels: Record<PaymentStatus, string> = {
    PENDING: 'Pendiente',
    COMPLETED: 'Pagado',
    FAILED: 'Fallido',
    REFUNDED: 'Reembolsado',
  };
  return labels[status] ?? status;
}

export function refundStatusLabel(status: RefundStatus): string {
  const labels: Record<RefundStatus, string> = {
    PENDING: 'Pendiente',
    COMPLETED: 'Completado',
    REJECTED: 'Rechazado',
  };
  return labels[status] ?? status;
}

export function returnStatusLabel(status: ReturnStatus): string {
  const labels: Record<ReturnStatus, string> = {
    REQUESTED: 'Solicitada',
    APPROVED: 'Aprobada',
    REJECTED: 'Rechazada',
    INSPECTION: 'En inspección',
    RESOLVED: 'Resuelta',
    RESOLUTION_PENDING_CREDIT_NOTE: 'Pendiente nota de crédito',
    CLOSED: 'Cerrada',
  };
  return labels[status] ?? status;
}

export function refundMethodLabel(method: RefundMethod): string {
  const labels: Record<RefundMethod, string> = {
    ORIGINAL_PAYMENT: 'Pago original',
    STORE_CREDIT: 'Crédito en tienda',
    EXCHANGE: 'Cambio',
  };
  return labels[method] ?? method;
}
