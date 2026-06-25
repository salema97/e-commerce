import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import {
  CreatePaymentIntentOptions,
  PaymentIntentResult,
  PaymentProvider,
  PaymentResult,
  ProviderPaymentResult,
  RefundResult,
  PaymentOrder,
  CheckoutSessionResult,
  PaymentStatus,
  RefundStatus,
} from '../public-api.js';

@Injectable()
export class StripeProvider extends PaymentProvider {
  private readonly stripe: Stripe;
  private readonly configService: ConfigService;

  constructor(configService: ConfigService) {
    super();
    this.configService = configService;
    this.stripe = new Stripe(configService.getOrThrow<string>('STRIPE_SECRET_KEY'), {
      apiVersion: '2025-06-30.basil',
    });
  }

  async createPaymentIntent(
    order: CreatePaymentIntentOptions,
  ): Promise<PaymentIntentResult> {
    const paymentIntent = await this.stripe.paymentIntents.create(
      {
        amount: order.amount,
        currency: order.currency.toLowerCase(),
        receipt_email: order.customerEmail,
        customer: order.customerId,
        metadata: {
          orderId: order.orderId,
          orderNumber: order.orderNumber,
          ...order.metadata,
        },
      },
      {
        idempotencyKey: order.idempotencyKey,
      },
    );

    return {
      providerTransactionId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret ?? '',
      status: this.mapPaymentIntentStatus(paymentIntent.status),
    };
  }

  async createCheckoutSession(order: PaymentOrder): Promise<CheckoutSessionResult> {
    const session = await this.stripe.checkout.sessions.create(
      {
        mode: 'payment',
        line_items: [
          {
            price_data: {
              currency: order.currency.toLowerCase(),
              product_data: {
                name: `Order ${order.orderNumber}`,
              },
              unit_amount: order.amount,
            },
            quantity: 1,
          },
        ],
        customer: order.customerId,
        customer_email: order.customerId ? undefined : order.customerEmail,
        metadata: {
          orderId: order.orderId,
          orderNumber: order.orderNumber,
          ...order.metadata,
        },
        success_url: this.configService.getOrThrow<string>('STRIPE_SUCCESS_URL'),
        cancel_url: this.configService.getOrThrow<string>('STRIPE_CANCEL_URL'),
      },
      {
        idempotencyKey: `checkout-${order.orderId}`,
      },
    );

    if (!session.url) {
      throw new Error('Stripe Checkout session did not return a URL');
    }

    return {
      sessionId: session.id,
      url: session.url,
    };
  }

  async capturePayment(externalId: string): Promise<void> {
    await this.stripe.paymentIntents.capture(externalId);
  }

  async confirmPayment(externalId: string): Promise<PaymentResult> {
    const paymentIntent = await this.stripe.paymentIntents.retrieve(externalId);

    return {
      providerTransactionId: paymentIntent.id,
      status: this.mapPaymentIntentStatus(paymentIntent.status),
    };
  }

  async refund(paymentId: string, amount?: number): Promise<RefundResult> {
    const refund = await this.stripe.refunds.create({
      payment_intent: paymentId,
      amount,
    });

    return {
      providerRefundId: refund.id,
      status: this.mapRefundStatus(refund.status),
    };
  }

  validateWebhookSignature(
    payload: Buffer,
    signature: string,
    secret: string,
  ): boolean {
    try {
      this.stripe.webhooks.constructEvent(payload, signature, secret);
      return true;
    } catch {
      return false;
    }
  }

  parseWebhookPayload(payload: unknown): Promise<ProviderPaymentResult> {
    const event = payload as {
      type?: string;
      data?: { object?: { id?: string; status?: string } };
    };

    let status: PaymentStatus = PaymentStatus.PENDING;
    if (event.type === 'payment_intent.succeeded' || event.type === 'checkout.session.completed') {
      status = PaymentStatus.COMPLETED;
    } else if (event.type === 'payment_intent.payment_failed') {
      status = PaymentStatus.FAILED;
    }

    return Promise.resolve({
      providerTransactionId: event.data?.object?.id ?? '',
      status,
      metadata: event as Record<string, unknown>,
    });
  }

  private mapPaymentIntentStatus(status: Stripe.PaymentIntent.Status): PaymentStatus {
    switch (status) {
      case 'succeeded':
        return PaymentStatus.COMPLETED;
      case 'canceled':
        return PaymentStatus.FAILED;
      case 'requires_payment_method':
      case 'requires_confirmation':
      case 'requires_action':
      case 'processing':
      default:
        return PaymentStatus.PENDING;
    }
  }

  private mapRefundStatus(status: string | null): RefundStatus {
    switch (status) {
      case 'succeeded':
        return RefundStatus.COMPLETED;
      case 'failed':
        return RefundStatus.REJECTED;
      case 'pending':
      case 'canceled':
      default:
        return RefundStatus.PENDING;
    }
  }
}
