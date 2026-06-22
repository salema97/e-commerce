import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import {
  CreatePaymentIntentOptions,
  PaymentIntentResult,
  PaymentProvider,
  PaymentResult,
  RefundResult,
} from '../payment-provider.interface.js';
import { PaymentStatus, RefundStatus } from '../entities/payment-status.enum.js';

@Injectable()
export class StripeProvider extends PaymentProvider {
  private readonly stripe: Stripe;

  constructor(configService: ConfigService) {
    super();
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
