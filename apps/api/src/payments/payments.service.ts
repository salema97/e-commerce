import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service.js';
import { PaymentProviderFactory } from './payment-provider.factory.js';
import { CreatePaymentIntentDto } from './dto/create-payment-intent.dto.js';
import {
  PaymentIntentResult,
  PaymentOrder,
} from './payment-provider.interface.js';
import { PaymentProvider as PaymentProviderEnum } from './payment-provider.enum.js';
import { PaymentStatus } from './entities/payment-status.enum.js';

export interface CreatePaymentIntentResult extends PaymentIntentResult {
  paymentId: string;
  idempotencyKey: string;
}

const IDEMPOTENCY_WINDOW_MS = 24 * 60 * 60 * 1000;

@Injectable()
export class PaymentsService {
  constructor(
    private readonly providerFactory: PaymentProviderFactory,
    private readonly prisma: PrismaService,
  ) {}

  async createPaymentIntent(
    dto: CreatePaymentIntentDto,
  ): Promise<CreatePaymentIntentResult> {
    const provider = this.providerFactory.getProvider(dto.provider);
    const idempotencyKey = dto.idempotencyKey ?? randomUUID();

    const existing = await this.prisma.payment.findFirst({
      where: {
        idempotencyKey,
        createdAt: {
          gte: new Date(Date.now() - IDEMPOTENCY_WINDOW_MS),
        },
      },
    });

    if (existing) {
      const metadata = (existing.metadata ?? {}) as Record<string, string>;
      return {
        paymentId: existing.id,
        providerTransactionId: existing.providerTransactionId ?? '',
        clientSecret: metadata.clientSecret ?? '',
        status: existing.status,
        idempotencyKey,
      };
    }

    const order: PaymentOrder = {
      orderId: dto.orderId,
      orderNumber: dto.orderNumber,
      amount: dto.amount,
      currency: dto.currency ?? 'USD',
      customerEmail: dto.customerEmail,
      metadata: dto.metadata,
    };

    const providerResult = await provider.createPaymentIntent({
      ...order,
      idempotencyKey,
    });

    const payment = await this.prisma.payment.create({
      data: {
        orderId: dto.orderId,
        provider: dto.provider,
        providerTransactionId: providerResult.providerTransactionId,
        idempotencyKey,
        amount: dto.amount / 100,
        currency: order.currency,
        status: providerResult.status,
        metadata: {
          ...dto.metadata,
          clientSecret: providerResult.clientSecret,
          idempotencyKey,
        },
      },
    });

    return {
      paymentId: payment.id,
      ...providerResult,
      idempotencyKey,
    };
  }
}
