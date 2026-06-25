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
import { PayPhoneWebhookDto } from '../public-api.js';

@Injectable()
export class PayPhoneProvider extends PaymentProvider {
  private readonly baseUrl = 'https://payphone.app';

  constructor(private readonly configService: ConfigService) {
    super();
  }

  private get token(): string {
    return this.configService.getOrThrow<string>('PAYPHONE_TOKEN');
  }

  private get storeId(): string {
    return this.configService.getOrThrow<string>('PAYPHONE_STORE_ID');
  }

  async createPaymentIntent(order: CreatePaymentIntentOptions): Promise<PaymentIntentResult> {
    const response = await fetch(`${this.baseUrl}/api/transaction/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.token}`,
      },
      body: JSON.stringify({
        amount: order.amount,
        reference: order.orderNumber,
        storeId: this.storeId,
        metadata: {
          orderId: order.orderId,
          ...order.metadata,
        },
      }),
    });

    const data = (await response.json()) as { transactionId?: string; message?: string };
    if (!response.ok) {
      throw new Error(`PayPhone transaction failed: ${data.message ?? response.statusText}`);
    }

    return {
      providerTransactionId: data.transactionId ?? `payphone_${order.orderId}`,
      clientSecret: '',
      status: PaymentStatus.PENDING,
    };
  }

  async createCheckoutSession(order: PaymentOrder): Promise<CheckoutSessionResult> {
    const result = await this.createPaymentIntent({ ...order, idempotencyKey: '' });
    return {
      sessionId: result.providerTransactionId,
      url: `${this.baseUrl}/pay/${result.providerTransactionId}`,
    };
  }

  capturePayment(): Promise<void> {
    throw new Error('PayPhone capturePayment is not implemented');
  }

  confirmPayment(externalId: string): Promise<PaymentResult> {
    return Promise.resolve({
      providerTransactionId: externalId,
      status: PaymentStatus.PENDING,
    });
  }

  refund(): Promise<RefundResult> {
    throw new Error('PayPhone refund is not implemented');
  }

  validateWebhookSignature(_payload: Buffer, signature: string, secret: string): boolean {
    return constantTimeCompare(signature, secret);
  }

  parseWebhookPayload(payload: unknown): Promise<ProviderPaymentResult> {
    const dto = payload as PayPhoneWebhookDto;
    const rawStatus = dto.transactionStatus as number | string | undefined;
    const status =
      rawStatus === 1 || rawStatus === '1'
        ? PaymentStatus.COMPLETED
        : rawStatus === -1 || rawStatus === '-1'
          ? PaymentStatus.FAILED
          : PaymentStatus.PENDING;

    return Promise.resolve({
      providerTransactionId: String(dto.id ?? dto.reference ?? ''),
      status,
      metadata: dto as Record<string, unknown>,
    });
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
