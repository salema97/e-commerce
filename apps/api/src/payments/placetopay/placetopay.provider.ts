import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash, randomBytes, timingSafeEqual } from 'crypto';
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
import { PlaceToPayWebhookDto } from '../public-api.js';
import { resilientFetch } from '../../common/resilience/resilient-fetch.js';
import { requirePaymentMetadataToken } from '../payment-metadata.util.js';

interface PlaceToPayAuth {
  login: string;
  tranKey: string;
  nonce: string;
  seed: string;
}

interface PlaceToPaySessionResponse {
  requestId?: number;
  processUrl?: string;
  status?: { status?: string; message?: string };
}

@Injectable()
export class PlaceToPayProvider extends PaymentProvider {
  constructor(private readonly configService: ConfigService) {
    super();
  }

  private get baseUrl(): string {
    return this.configService.getOrThrow<string>('PLACETOPAY_BASE_URL');
  }

  private get login(): string {
    return this.configService.getOrThrow<string>('PLACETOPAY_LOGIN');
  }

  private get secretKey(): string {
    return this.configService.getOrThrow<string>('PLACETOPAY_SECRET_KEY');
  }

  private buildAuth(): PlaceToPayAuth {
    const seed = new Date().toISOString();
    const nonce = randomBytes(16).toString('base64');
    const tranKey = createHash('sha256')
      .update(`${seed}${this.secretKey}`, 'utf8')
      .digest('base64');
    return { login: this.login, tranKey, nonce, seed };
  }

  async createPaymentIntent(order: CreatePaymentIntentOptions): Promise<PaymentIntentResult> {
    const session = await this.createSession(order);
    return {
      providerTransactionId: String(session.requestId ?? `ptp_${order.orderId}`),
      clientSecret: '',
      status: mapPlaceToPayStatus(session.status?.status),
    };
  }

  async createCheckoutSession(order: PaymentOrder): Promise<CheckoutSessionResult> {
    const session = await this.createSession(order);
    return {
      sessionId: String(session.requestId ?? `ptp_${order.orderId}`),
      url: session.processUrl ?? '',
    };
  }

  private async createSession(order: PaymentOrder): Promise<PlaceToPaySessionResponse> {
    const response = await resilientFetch('payments.placetopay', `${this.baseUrl}/api/session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        auth: this.buildAuth(),
        payment: {
          reference: order.orderNumber,
          description: `Order ${order.orderNumber}`,
          amount: {
            currency: order.currency,
            total: order.amount / 100,
          },
        },
        returnUrl: requirePaymentMetadataToken(order.metadata, 'returnUrl', 'PlaceToPay'),
        expiration: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      }),
    });

    const data = (await response.json()) as PlaceToPaySessionResponse & { message?: string };
    if (!response.ok) {
      throw new Error(`PlaceToPay session failed: ${data.message ?? response.statusText}`);
    }
    return data;
  }

  capturePayment(): Promise<void> {
    throw new Error('PlaceToPay capturePayment is not implemented');
  }

  confirmPayment(externalId: string): Promise<PaymentResult> {
    return Promise.resolve({
      providerTransactionId: externalId,
      status: PaymentStatus.PENDING,
    });
  }

  refund(): Promise<RefundResult> {
    throw new Error('PlaceToPay refund is not implemented');
  }

  validateWebhookSignature(_payload: Buffer, signature: string, secret: string): boolean {
    return constantTimeCompare(signature, secret);
  }

  parseWebhookPayload(payload: unknown): Promise<ProviderPaymentResult> {
    const dto = payload as PlaceToPayWebhookDto;
    return Promise.resolve({
      providerTransactionId: String(dto.requestId ?? dto.reference ?? ''),
      status: mapPlaceToPayStatus(dto.status),
      metadata: dto as Record<string, unknown>,
    });
  }
}

function mapPlaceToPayStatus(status?: string): PaymentStatus {
  switch (status?.toLowerCase()) {
    case 'approved':
      return PaymentStatus.COMPLETED;
    case 'rejected':
    case 'failed':
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
