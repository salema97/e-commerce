import type { PaymentStatus, PaymentProvider } from './enums.js';

export interface Payment {
  id: string;
  orderId: string;
  provider: PaymentProvider;
  providerTransactionId?: string | null;
  idempotencyKey?: string | null;
  amount: number;
  currency: string;
  status: PaymentStatus;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
  order?: unknown;
  refunds?: unknown[];
}

export interface CreatePaymentIntentDto {
  orderId: string;
  orderNumber: string;
  amount: number;
  currency?: string;
  provider: PaymentProvider;
  idempotencyKey?: string;
  customerEmail?: string;
  metadata?: Record<string, string>;
}

export interface PaymentIntentResult {
  clientSecret?: string;
  paymentIntentId?: string;
  publicKey?: string;
  provider: PaymentProvider;
  amount: number;
  currency: string;
}

export interface PaymentWebhookPayload {
  type: string;
  data: Record<string, unknown>;
}

export interface PaymentWebhookResponseDto {
  received: boolean;
}

export type PaymentWebhookEventType =
  | 'payment_intent.succeeded'
  | 'payment_intent.payment_failed'
  | 'charge.refunded'
  | 'checkout.session.completed';
