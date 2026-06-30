import {
  Injectable,
  Logger,
  UnauthorizedException,
  Inject,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service.js';
import { StripeProvider } from './stripe.provider.js';
import { PaymentStatus } from '../public-api.js';
import { OrderStatus, PaymentProvider, SubscriptionStatus } from '@prisma/client';
import { SriQueueService } from '../../invoices/sri/sri-queue.service.js';
import { InventoryReservationService } from '../../inventory/inventory-reservation.service.js';
import { AuditLogService } from '../../audit/audit-log.service.js';
import { EventBus } from '../../event-bus/event-bus.interface.js';
import { RedisIdempotencyService } from '../../common/redis/idempotency.service.js';
import { ALERT_EVENT_NAMES } from '@repo/shared-types';

interface StripeEvent {
  id: string;
  type: string;
  data: { object: Record<string, unknown> };
}

interface PaymentTransactionIds {
  providerTransactionId: string;
  checkoutSessionId?: string;
}

@Injectable()
export class StripeWebhookService {
  private readonly logger = new Logger(StripeWebhookService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly stripeProvider: StripeProvider,
    private readonly prisma: PrismaService,
    private readonly sriQueue: SriQueueService,
    private readonly reservationService: InventoryReservationService,
    private readonly auditLogService: AuditLogService,
    @Inject(EventBus) private readonly eventBus: EventBus,
    private readonly idempotency: RedisIdempotencyService,
  ) {}

  async handleWebhook(rawBody: Buffer, signature: string): Promise<void> {
    const secret = this.configService.getOrThrow<string>('STRIPE_WEBHOOK_SECRET');

    if (!this.stripeProvider.validateWebhookSignature(rawBody, signature, secret)) {
      void this.eventBus.publish({
        name: ALERT_EVENT_NAMES.WEBHOOK_FAILURE,
        payload: {
          provider: 'STRIPE',
          reason: 'invalid_signature',
          message: 'Invalid Stripe webhook signature',
        },
      });
      throw new UnauthorizedException('Invalid Stripe webhook signature');
    }

    const event = JSON.parse(rawBody.toString()) as StripeEvent;

    this.logger.debug(`Received Stripe event: ${event.type} (${event.id})`);

    const idempotencyKey = `stripe:event:${event.id}`;
    const claimed = await this.idempotency.claim(idempotencyKey);
    if (!claimed) {
      this.logger.debug(`Stripe event ${event.id} already processed; skipping`);
      return;
    }

    try {
      switch (event.type) {
      case 'checkout.session.completed':
        await this.handleCheckoutSessionCompleted(event.data.object, event.id);
        break;
      case 'payment_intent.succeeded':
        await this.handlePaymentIntentSucceeded(event.data.object, event.id);
        break;
      case 'payment_intent.payment_failed':
        await this.handlePaymentIntentFailed(event.data.object, event.id);
        break;
      case 'charge.refunded':
        await this.handleChargeRefunded(event.data.object, event.id);
        break;
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await this.handleSubscriptionUpsert(event.data.object, event.id);
        break;
      case 'customer.subscription.deleted':
        await this.handleSubscriptionDeleted(event.data.object, event.id);
        break;
      case 'invoice.paid':
        await this.handleInvoicePaid(event.data.object, event.id);
        break;
      default:
        this.logger.warn(`Unhandled Stripe event type: ${event.type}`);
      }
    } catch (error) {
      await this.idempotency.release(idempotencyKey);
      void this.eventBus.publish({
        name: ALERT_EVENT_NAMES.WEBHOOK_FAILURE,
        payload: {
          provider: 'STRIPE',
          eventId: event.id,
          eventType: event.type,
          reason: 'processing_error',
          message: error instanceof Error ? error.message : String(error),
        },
      });
      throw error;
    }
  }

  private async handleCheckoutSessionCompleted(
    object: Record<string, unknown>,
    eventId: string,
  ): Promise<void> {
    const metadata = object.metadata as Record<string, string> | undefined;
    if (object.mode === 'subscription' || metadata?.subscriptionCheckout === 'true') {
      await this.recordWebhookProcessed(eventId, metadata?.userId ?? 'subscription', 'subscription_checkout');
      return;
    }

    const sessionId = object.id as string;
    const paymentIntentId = (object.payment_intent as string) ?? undefined;
    const orderId = (object.metadata as Record<string, string> | undefined)?.orderId;
    const amount = object.amount_total as number | undefined;
    const currency = (object.currency as string) ?? 'usd';

    if (!orderId) {
      this.logger.error(`Stripe session ${sessionId} missing orderId metadata`);
      return;
    }

    const ids: PaymentTransactionIds = paymentIntentId
      ? { providerTransactionId: paymentIntentId, checkoutSessionId: sessionId }
      : { providerTransactionId: sessionId, checkoutSessionId: sessionId };

    const payment = await this.upsertPaymentForWebhook(orderId, ids, amount, currency);

    if (payment.status === PaymentStatus.COMPLETED) {
      await this.ensurePostPaymentSideEffects(payment.orderId);
      await this.recordWebhookProcessed(eventId, payment.orderId, 'duplicate');
      return;
    }

    await this.confirmOrderPayment(payment.orderId, payment.id, eventId, 'checkout.session.completed');
  }

  private async handlePaymentIntentSucceeded(
    object: Record<string, unknown>,
    eventId: string,
  ): Promise<void> {
    const providerTransactionId = object.id as string;
    const payment = await this.findPaymentByTransactionId(providerTransactionId);

    if (!payment) {
      this.logger.error(
        `Payment record not found for transaction ${providerTransactionId}`,
      );
      return;
    }

    if (payment.status === PaymentStatus.COMPLETED) {
      await this.ensurePostPaymentSideEffects(payment.orderId);
      await this.recordWebhookProcessed(eventId, payment.orderId, 'duplicate');
      return;
    }

    await this.confirmOrderPayment(payment.orderId, payment.id, eventId, 'payment_intent.succeeded');
  }

  private async handlePaymentIntentFailed(
    object: Record<string, unknown>,
    eventId: string,
  ): Promise<void> {
    const providerTransactionId = object.id as string;
    const payment = await this.findPaymentByTransactionId(providerTransactionId);

    if (!payment) {
      this.logger.error(
        `Payment record not found for transaction ${providerTransactionId}`,
      );
      return;
    }

    const errorMessage =
      (object.last_payment_error as Record<string, unknown> | undefined)?.message ??
      'Payment failed';

    const metadata = {
      ...(payment.metadata as Record<string, unknown>),
      failedAt: new Date().toISOString(),
      errorMessage,
    };

    await this.prisma.$transaction([
      this.prisma.payment.update({
        where: { id: payment.id },
        data: { status: PaymentStatus.FAILED, metadata },
      }),
      this.prisma.order.update({
        where: { id: payment.orderId },
        data: { status: OrderStatus.PAYMENT_FAILED },
      }),
      this.prisma.orderStatusHistory.create({
        data: {
          orderId: payment.orderId,
          status: OrderStatus.PAYMENT_FAILED,
          notes: 'Payment failed via Stripe',
        },
      }),
    ]);

    await this.recordWebhookProcessed(eventId, payment.orderId, 'failed');
    await this.auditPayment(payment.orderId, payment.id, 'payment_failed', {
      fromStatus: payment.status,
      toStatus: PaymentStatus.FAILED,
      errorMessage,
    });

    this.logger.log(`Payment ${payment.id} marked as FAILED`);
  }

  private async handleChargeRefunded(
    object: Record<string, unknown>,
    eventId: string,
  ): Promise<void> {
    const paymentIntentId = object.payment_intent as string | undefined;
    const providerTransactionId = paymentIntentId ?? (object.id as string);
    const payment = await this.findPaymentByTransactionId(providerTransactionId);

    if (!payment) {
      this.logger.error(
        `Payment record not found for transaction ${providerTransactionId}`,
      );
      return;
    }

    const metadata = {
      ...(payment.metadata as Record<string, unknown>),
      refundedAt: new Date().toISOString(),
    };

    await this.prisma.$transaction([
      this.prisma.payment.update({
        where: { id: payment.id },
        data: { status: PaymentStatus.REFUNDED, metadata },
      }),
      this.prisma.order.update({
        where: { id: payment.orderId },
        data: { status: OrderStatus.REFUNDED },
      }),
      this.prisma.orderStatusHistory.create({
        data: {
          orderId: payment.orderId,
          status: OrderStatus.REFUNDED,
          notes: 'Refund confirmed via Stripe',
        },
      }),
    ]);

    await this.recordWebhookProcessed(eventId, payment.orderId, 'refunded');
    await this.auditPayment(payment.orderId, payment.id, 'refunded', {
      fromStatus: payment.status,
      toStatus: PaymentStatus.REFUNDED,
    });

    this.logger.log(`Payment ${payment.id} marked as REFUNDED`);
  }

  private async confirmOrderPayment(
    orderId: string,
    paymentId: string,
    eventId: string,
    source: string,
  ): Promise<void> {
    const existing = await this.prisma.payment.findUnique({ where: { id: paymentId } });
    if (existing?.status === PaymentStatus.COMPLETED) {
      await this.ensurePostPaymentSideEffects(orderId);
      return;
    }

    await this.ensurePostPaymentSideEffects(orderId);

    const payment = await this.prisma.payment.findUnique({ where: { id: paymentId } });
    const metadata = { ...(payment?.metadata as Record<string, unknown>), paidAt: new Date().toISOString() };

    await this.prisma.$transaction(async (tx) => {
      await tx.payment.update({
        where: { id: paymentId },
        data: {
          status: PaymentStatus.COMPLETED,
          metadata,
        },
      });
      await tx.order.update({
        where: { id: orderId },
        data: { status: OrderStatus.PROCESSING },
      });
      await tx.orderStatusHistory.create({
        data: {
          orderId,
          status: OrderStatus.PROCESSING,
          notes: `Payment confirmed via Stripe (${source})`,
        },
      });
    });

    await this.recordWebhookProcessed(eventId, orderId, 'completed');
    await this.auditPayment(orderId, paymentId, 'payment_completed', {
      toStatus: PaymentStatus.COMPLETED,
      orderStatus: OrderStatus.PROCESSING,
      source,
    });

    this.logger.log(`Payment ${paymentId} marked as COMPLETED`);

    void this.eventBus.publish({ name: 'order.paid', payload: { orderId } });
    this.enqueueInvoice(orderId);
  }

  private async ensurePostPaymentSideEffects(orderId: string): Promise<void> {
    await this.reservationService.confirm(orderId);
  }

  private enqueueInvoice(orderId: string): void {
    void this.sriQueue
      .addIssueInvoiceJob(orderId)
      .then(() => {
        this.logger.log(`SRI invoice job enqueued for order ${orderId}`);
      })
      .catch((error: unknown) => {
        const message = error instanceof Error ? error.message : String(error);
        this.logger.error(
          { error: message, orderId },
          'Failed to enqueue SRI invoice job from Stripe webhook',
        );
      });
  }

  private async upsertPaymentForWebhook(
    orderId: string,
    ids: PaymentTransactionIds,
    amount?: number,
    currency?: string,
  ) {
    const existing = ids.providerTransactionId
      ? await this.findPaymentByTransactionId(ids.providerTransactionId)
      : null;

    if (existing) return existing;

    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) {
      throw new Error(`Order ${orderId} not found for Stripe webhook`);
    }

    return this.prisma.payment.create({
      data: {
        orderId,
        provider: PaymentProvider.STRIPE,
        providerTransactionId: ids.providerTransactionId,
        checkoutSessionId: ids.checkoutSessionId,
        amount: amount ? amount / 100 : order.total,
        currency: (currency ?? 'USD').toUpperCase(),
        status: PaymentStatus.PENDING,
      },
    });
  }

  private async recordWebhookProcessed(
    eventId: string,
    orderId: string,
    outcome: string,
  ): Promise<void> {
    await this.auditLogService.log({
      actorId: 'system',
      resource: 'stripe-webhook',
      action: 'processed',
      resourceId: eventId,
      metadata: { orderId, outcome },
    });
  }

  private async auditPayment(
    orderId: string,
    paymentId: string,
    action: string,
    metadata: Record<string, unknown>,
  ): Promise<void> {
    await this.auditLogService.log({
      actorId: 'system',
      resource: 'payment',
      action,
      resourceId: paymentId,
      metadata: { orderId, ...metadata },
    });
  }

  private findPaymentByTransactionId(providerTransactionId: string) {
    return this.prisma.payment.findFirst({
      where: { providerTransactionId },
    });
  }

  private mapStripeSubscriptionStatus(status: string): SubscriptionStatus {
    switch (status) {
      case 'trialing':
        return SubscriptionStatus.TRIALING;
      case 'active':
        return SubscriptionStatus.ACTIVE;
      case 'past_due':
        return SubscriptionStatus.PAST_DUE;
      case 'paused':
        return SubscriptionStatus.PAUSED;
      case 'canceled':
        return SubscriptionStatus.CANCELLED;
      default:
        return SubscriptionStatus.EXPIRED;
    }
  }

  private async handleSubscriptionUpsert(
    object: Record<string, unknown>,
    eventId: string,
  ): Promise<void> {
    const stripeSubscriptionId = object.id as string;
    const metadata = (object.metadata as Record<string, string> | undefined) ?? {};
    const userId = metadata.userId;
    const planId = metadata.planId;
    if (!userId || !planId) {
      this.logger.warn({ stripeSubscriptionId }, 'Subscription webhook missing userId/planId metadata');
      return;
    }

    const status = this.mapStripeSubscriptionStatus(String(object.status ?? 'active'));
    const currentPeriodStart = object.current_period_start
      ? new Date(Number(object.current_period_start) * 1000)
      : undefined;
    const currentPeriodEnd = object.current_period_end
      ? new Date(Number(object.current_period_end) * 1000)
      : undefined;

    const existing = await this.prisma.customerSubscription.findFirst({
      where: { stripeSubscriptionId },
    });

    if (existing) {
      await this.prisma.customerSubscription.update({
        where: { id: existing.id },
        data: {
          status,
          currentPeriodStart,
          currentPeriodEnd,
          cancelAtPeriodEnd: Boolean(object.cancel_at_period_end),
        },
      });
    } else {
      await this.prisma.customerSubscription.create({
        data: {
          userId,
          planId,
          stripeSubscriptionId,
          status,
          currentPeriodStart,
          currentPeriodEnd,
          cancelAtPeriodEnd: Boolean(object.cancel_at_period_end),
        },
      });
    }

    await this.recordWebhookProcessed(eventId, stripeSubscriptionId, 'subscription_upsert');
  }

  private async handleSubscriptionDeleted(
    object: Record<string, unknown>,
    eventId: string,
  ): Promise<void> {
    const stripeSubscriptionId = object.id as string;
    const existing = await this.prisma.customerSubscription.findFirst({
      where: { stripeSubscriptionId },
    });
    if (!existing) return;

    await this.prisma.customerSubscription.update({
      where: { id: existing.id },
      data: {
        status: SubscriptionStatus.CANCELLED,
        cancelledAt: new Date(),
        cancelAtPeriodEnd: false,
      },
    });
    await this.recordWebhookProcessed(eventId, stripeSubscriptionId, 'subscription_deleted');
  }

  private async handleInvoicePaid(object: Record<string, unknown>, eventId: string): Promise<void> {
    const billingReason = String(object.billing_reason ?? '');
    if (billingReason !== 'subscription_cycle' && billingReason !== 'subscription_create') {
      return;
    }

    const stripeSubscriptionId = object.subscription as string | undefined;
    if (!stripeSubscriptionId) return;

    const subscription = await this.prisma.customerSubscription.findFirst({
      where: { stripeSubscriptionId },
      include: {
        plan: { include: { product: true } },
        user: true,
      },
    });
    if (!subscription?.plan.product) return;

    const amountPaid = Number(object.amount_paid ?? 0) / 100;
    const product = subscription.plan.product;
    const orderNumber = `SUB-${Date.now().toString(36).toUpperCase()}`;
    const taxAmount = 0;
    const total = amountPaid || Number(product.price);

    const order = await this.prisma.order.create({
      data: {
        orderNumber,
        userId: subscription.userId,
        customerEmail: subscription.user.email,
        customerName: subscription.user.name,
        status: OrderStatus.PROCESSING,
        channel: 'WEB',
        subtotal: total,
        taxAmount,
        shippingAmount: 0,
        discountAmount: 0,
        total,
        items: {
          create: {
            productId: product.id,
            name: product.name,
            sku: product.sku ?? 'SUB',
            price: total,
            quantity: 1,
          },
        },
        statusHistory: {
          create: {
            status: OrderStatus.PROCESSING,
            notes: `Subscription renewal (${billingReason})`,
          },
        },
      },
    });

    void this.eventBus.publish({ name: 'order.paid', payload: { orderId: order.id } });
    this.enqueueInvoice(order.id);
    await this.recordWebhookProcessed(eventId, order.id, 'subscription_invoice_paid');
  }
}
