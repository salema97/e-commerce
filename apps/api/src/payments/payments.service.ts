import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service.js';
import { PaymentProviderFactory } from './payment-provider.factory.js';
import { StripeCustomerService } from './stripe/stripe-customer.service.js';
import { CreatePaymentIntentDto } from './dto/create-payment-intent.dto.js';
import {
  CheckoutSessionResult,
  PaymentIntentResult,
  PaymentOrder,
  ProviderSelectionContext,
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
    private readonly stripeCustomerService: StripeCustomerService,
  ) {}

  async createPaymentIntent(
    dto: CreatePaymentIntentDto,
    actorUserId?: string,
  ): Promise<CreatePaymentIntentResult> {
    if (actorUserId) {
      await this.ensureOrderOwnership(dto.orderId, actorUserId);
    }

    const provider = this.providerFactory.getProvider(dto.provider);
    const idempotencyKey = dto.idempotencyKey ?? randomUUID();

    const existing = await this.findExistingPayment(idempotencyKey);

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

    const customerId = await this.resolveCustomer(dto);

    const order: PaymentOrder = {
      orderId: dto.orderId,
      orderNumber: dto.orderNumber,
      amount: dto.amount,
      currency: dto.currency ?? 'USD',
      customerEmail: dto.customerEmail,
      customerId,
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

  async createCheckoutSession(
    dto: CreatePaymentIntentDto,
  ): Promise<CheckoutSessionResult & { paymentId: string }> {
    const provider = this.providerFactory.getProvider(dto.provider);
    const idempotencyKey = dto.idempotencyKey ?? randomUUID();

    const existing = await this.findExistingPayment(idempotencyKey);
    if (existing) {
      const metadata = (existing.metadata ?? {}) as Record<string, string>;
      return {
        paymentId: existing.id,
        sessionId: metadata.sessionId ?? '',
        url: metadata.checkoutUrl ?? '',
      };
    }

    const customerId = await this.resolveCustomer(dto);

    const order: PaymentOrder = {
      orderId: dto.orderId,
      orderNumber: dto.orderNumber,
      amount: dto.amount,
      currency: dto.currency ?? 'USD',
      customerEmail: dto.customerEmail,
      customerId,
      metadata: dto.metadata,
    };

    const session = await provider.createCheckoutSession(order);

    const payment = await this.prisma.payment.create({
      data: {
        orderId: dto.orderId,
        provider: dto.provider,
        checkoutSessionId: session.sessionId,
        idempotencyKey,
        amount: dto.amount / 100,
        currency: order.currency,
        status: PaymentStatus.PENDING,
        metadata: {
          ...dto.metadata,
          sessionId: session.sessionId,
          checkoutUrl: session.url,
          idempotencyKey,
        },
      },
    });

    return {
      paymentId: payment.id,
      sessionId: session.sessionId,
      url: session.url,
    };
  }

  resolveProviderByContext(context: ProviderSelectionContext): PaymentProviderEnum {
    const provider = this.providerFactory.resolveProvider(context);
    return this.providerFactory.getProviderName(provider) ?? PaymentProviderEnum.STRIPE;
  }

  private findExistingPayment(idempotencyKey: string) {
    return this.prisma.payment.findFirst({
      where: {
        idempotencyKey,
        createdAt: {
          gte: new Date(Date.now() - IDEMPOTENCY_WINDOW_MS),
        },
      },
    });
  }

  private resolveCustomer(dto: CreatePaymentIntentDto): Promise<string | undefined> {
    if (dto.customerEmail && !dto.customerId) {
      return this.stripeCustomerService.findOrCreateEphemeralCustomer(dto.customerEmail);
    }
    return Promise.resolve(dto.customerId);
  }

  private async ensureOrderOwnership(orderId: string, actorUserId: string): Promise<void> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      select: { id: true, userId: true },
    });
    if (!order) {
      throw new NotFoundException(`Order ${orderId} not found`);
    }
    if (!order.userId || order.userId !== actorUserId) {
      throw new ForbiddenException(
        `Order ${orderId} does not belong to the authenticated user`,
      );
    }
  }
}
