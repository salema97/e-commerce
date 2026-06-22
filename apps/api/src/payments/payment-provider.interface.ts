import { PaymentStatus, RefundStatus } from './entities/payment-status.enum.js';

export interface PaymentOrder {
  orderId: string;
  orderNumber: string;
  amount: number;
  currency: string;
  customerEmail?: string;
  customerId?: string;
  metadata?: Record<string, string>;
}

export interface CreatePaymentIntentOptions extends PaymentOrder {
  idempotencyKey: string;
}

export interface PaymentIntentResult {
  providerTransactionId: string;
  clientSecret: string;
  status: PaymentStatus;
}

export interface CheckoutSessionResult {
  sessionId: string;
  url: string;
}

export interface PaymentResult {
  providerTransactionId: string;
  status: PaymentStatus;
}

export interface RefundResult {
  providerRefundId: string;
  status: RefundStatus;
}

export interface ProviderSelectionContext {
  country?: string;
  currency?: string;
  channel?: string;
  method?: string;
  adminOverride?: string;
}

export abstract class PaymentProvider {
  abstract createPaymentIntent(
    order: CreatePaymentIntentOptions,
  ): Promise<PaymentIntentResult>;

  abstract createCheckoutSession(order: PaymentOrder): Promise<CheckoutSessionResult>;

  abstract capturePayment(externalId: string): Promise<void>;

  abstract confirmPayment(externalId: string): Promise<PaymentResult>;

  abstract refund(paymentId: string, amount?: number): Promise<RefundResult>;

  abstract validateWebhookSignature(
    payload: Buffer,
    signature: string,
    secret: string,
  ): boolean;
}
