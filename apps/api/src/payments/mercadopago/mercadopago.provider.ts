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
import { MercadoPagoWebhookDto } from '../public-api.js';
import { resilientFetch } from '../../common/resilience/resilient-fetch.js';
import { requirePaymentMetadataToken } from '../payment-metadata.util.js';

@Injectable()
export class MercadoPagoProvider extends PaymentProvider {
  private readonly baseUrl = 'https://api.mercadopago.com';

  constructor(private readonly configService: ConfigService) {
    super();
  }

  private get accessToken(): string {
    return this.configService.getOrThrow<string>('MERCADOPAGO_ACCESS_TOKEN');
  }

  async createPaymentIntent(order: CreatePaymentIntentOptions): Promise<PaymentIntentResult> {
    const token = requirePaymentMetadataToken(
      order.metadata,
      'mercadoPagoToken',
      'MercadoPago',
    );
    const response = await resilientFetch('payments.mercadopago', `${this.baseUrl}/v1/payments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.accessToken}`,
        'X-Idempotency-Key': order.idempotencyKey,
      },
      body: JSON.stringify({
        token,
        transaction_amount: order.amount / 100,
        currency_id: order.currency,
        external_reference: order.orderId,
        description: `Order ${order.orderNumber}`,
      }),
    });

    const data = (await response.json()) as { id?: number; message?: string };
    if (!response.ok) {
      throw new Error(`MercadoPago payment failed: ${data.message ?? response.statusText}`);
    }

    return {
      providerTransactionId: String(data.id ?? `mp_${order.orderId}`),
      clientSecret: '',
      status: PaymentStatus.PENDING,
    };
  }

  async createCheckoutSession(order: PaymentOrder): Promise<CheckoutSessionResult> {
    const response = await resilientFetch(
      'payments.mercadopago',
      `${this.baseUrl}/checkout/preferences`,
      {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.accessToken}`,
      },
      body: JSON.stringify({
        items: [
          {
            title: `Order ${order.orderNumber}`,
            quantity: 1,
            unit_price: order.amount / 100,
            currency_id: order.currency,
          },
        ],
        external_reference: order.orderId,
      }),
    });

    const data = (await response.json()) as { id?: string; init_point?: string; message?: string };
    if (!response.ok) {
      throw new Error(`MercadoPago preference failed: ${data.message ?? response.statusText}`);
    }

    return {
      sessionId: data.id ?? `mp_${order.orderId}`,
      url: data.init_point ?? '',
    };
  }

  capturePayment(): Promise<void> {
    throw new Error('MercadoPago capturePayment is not implemented');
  }

  confirmPayment(externalId: string): Promise<PaymentResult> {
    return Promise.resolve({
      providerTransactionId: externalId,
      status: PaymentStatus.PENDING,
    });
  }

  refund(): Promise<RefundResult> {
    throw new Error('MercadoPago refund is not implemented');
  }

  validateWebhookSignature(_payload: Buffer, signature: string, secret: string): boolean {
    return constantTimeCompare(signature, secret);
  }

  parseWebhookPayload(payload: unknown): Promise<ProviderPaymentResult> {
    const dto = payload as MercadoPagoWebhookDto;
    const status = dto.type === 'payment.updated' ? PaymentStatus.COMPLETED : PaymentStatus.PENDING;
    return Promise.resolve({
      providerTransactionId: String(dto.data_id ?? dto.id ?? ''),
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
