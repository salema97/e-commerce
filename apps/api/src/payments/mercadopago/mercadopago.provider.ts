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
import { MercadoPagoWebhookDto } from '../dto/provider-webhook.dto.js';

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
    const response = await fetch(`${this.baseUrl}/v1/payments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.accessToken}`,
        'X-Idempotency-Key': order.idempotencyKey,
      },
      body: JSON.stringify({
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
    const response = await fetch(`${this.baseUrl}/checkout/preferences`, {
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

  async capturePayment(): Promise<void> {
    throw new Error('MercadoPago capturePayment is not implemented');
  }

  async confirmPayment(externalId: string): Promise<PaymentResult> {
    return {
      providerTransactionId: externalId,
      status: PaymentStatus.PENDING,
    };
  }

  async refund(): Promise<RefundResult> {
    throw new Error('MercadoPago refund is not implemented');
  }

  validateWebhookSignature(_payload: Buffer, signature: string, secret: string): boolean {
    return constantTimeCompare(signature, secret);
  }

  async parseWebhookPayload(payload: unknown): Promise<ProviderPaymentResult> {
    const dto = payload as MercadoPagoWebhookDto;
    const status = dto.type === 'payment.updated' ? PaymentStatus.COMPLETED : PaymentStatus.PENDING;
    return {
      providerTransactionId: String(dto.data_id ?? dto.id ?? ''),
      status,
      metadata: dto as Record<string, unknown>,
    };
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
