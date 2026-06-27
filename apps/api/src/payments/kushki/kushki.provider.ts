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
import { PaymentStatus } from '../public-api.js';
import { KushkiWebhookDto } from '../public-api.js';
import { resilientFetch } from '../../common/resilience/resilient-fetch.js';
import { requirePaymentMetadataToken } from '../payment-metadata.util.js';

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
    const token = requirePaymentMetadataToken(order.metadata, 'kushkiToken', 'Kushki');
    const response = await resilientFetch('payments.kushki', `${this.baseUrl}/card/v1/charges`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Private-Merchant-Id': this.privateKey,
      },
      body: JSON.stringify({
        token,
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

  capturePayment(): Promise<void> {
    throw new Error('Kushki capturePayment is not implemented');
  }

  confirmPayment(externalId: string): Promise<PaymentResult> {
    return Promise.resolve({
      providerTransactionId: externalId,
      status: PaymentStatus.PENDING,
    });
  }

  refund(): Promise<RefundResult> {
    throw new Error('Kushki refund is not implemented');
  }

  validateWebhookSignature(_payload: Buffer, signature: string, secret: string): boolean {
    return constantTimeCompare(signature, secret);
  }

  parseWebhookPayload(payload: unknown): Promise<ProviderPaymentResult> {
    const dto = payload as KushkiWebhookDto;
    const status = mapKushkiStatus(dto.status);
    return Promise.resolve({
      providerTransactionId: dto.transactionReference ?? '',
      status,
      metadata: dto as Record<string, unknown>,
    });
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
