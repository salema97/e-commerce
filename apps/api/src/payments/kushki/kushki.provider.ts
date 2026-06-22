import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { timingSafeEqual } from 'crypto';
import {
  CreatePaymentIntentOptions,
  PaymentIntentResult,
  PaymentOrder,
  PaymentProvider,
  PaymentResult,
  ProviderPaymentResult,
  RefundResult,
  CheckoutSessionResult,
} from '../payment-provider.interface.js';
import { PaymentStatus } from '../entities/payment-status.enum.js';
import { KushkiWebhookDto } from '../dto/provider-webhook.dto.js';

@Injectable()
export class KushkiProvider extends PaymentProvider {
  private readonly baseUrl = 'https://api.kushkipagos.com';

  constructor(private readonly configService: ConfigService) {
    super();
  }

  private get privateKey(): string {
    return this.configService.getOrThrow<string>('KUSHKI_PRIVATE_KEY');
  }

  async createPaymentIntent(order: CreatePaymentIntentOptions): Promise<PaymentIntentResult> {
    const response = await fetch(`${this.baseUrl}/card/v1/charges`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Private-Merchant-Id': this.privateKey,
      },
      body: JSON.stringify({
        token: 'tok_placeholder',
        amount: order.amount,
        currency: order.currency,
        metadata: {
          orderId: order.orderId,
          orderNumber: order.orderNumber,
          ...order.metadata,
        },
      }),
    });

    const data = (await response.json()) as { transactionReference?: string; message?: string };
    if (!response.ok) {
      throw new Error(`Kushki charge failed: ${data.message ?? response.statusText}`);
    }

    return {
      providerTransactionId: data.transactionReference ?? `kushki_${order.orderId}`,
      clientSecret: '',
      status: PaymentStatus.PENDING,
    };
  }

  async createCheckoutSession(order: PaymentOrder): Promise<CheckoutSessionResult> {
    const result = await this.createPaymentIntent({ ...order, idempotencyKey: '' });
    return {
      sessionId: result.providerTransactionId,
      url: `${this.baseUrl}/checkout/${result.providerTransactionId}`,
    };
  }

  async capturePayment(): Promise<void> {
    throw new Error('Kushki capturePayment is not implemented');
  }

  async confirmPayment(externalId: string): Promise<PaymentResult> {
    return {
      providerTransactionId: externalId,
      status: PaymentStatus.PENDING,
    };
  }

  async refund(): Promise<RefundResult> {
    throw new Error('Kushki refund is not implemented');
  }

  validateWebhookSignature(_payload: Buffer, signature: string, secret: string): boolean {
    return constantTimeCompare(signature, secret);
  }

  async parseWebhookPayload(payload: unknown): Promise<ProviderPaymentResult> {
    const dto = payload as KushkiWebhookDto;
    const status = mapKushkiStatus(dto.status);
    return {
      providerTransactionId: dto.transactionReference ?? '',
      status,
      metadata: dto as Record<string, unknown>,
    };
  }
}

function mapKushkiStatus(status?: string): PaymentStatus {
  switch (status?.toLowerCase()) {
    case 'approved':
    case '3dsecure':
      return PaymentStatus.COMPLETED;
    case 'declined':
    case 'rejected':
      return PaymentStatus.FAILED;
    default:
      return PaymentStatus.PENDING;
  }
}

function constantTimeCompare(a: string, b: string): boolean {
  try {
    const bufA = Buffer.from(a);
    const bufB = Buffer.from(b);
    if (bufA.length !== bufB.length) return false;
    return timingSafeEqual(bufA, bufB);
  } catch {
    return false;
  }
}
