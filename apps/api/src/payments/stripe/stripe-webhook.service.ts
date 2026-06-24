import {
  Injectable,
  Logger,
  UnauthorizedException,
  Inject,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service.js';
import { StripeProvider } from './stripe.provider.js';
import { PaymentStatus } from '../entities/payment-status.enum.js';
import { OrderStatus, PaymentProvider } from '@prisma/client';
import { SriQueueService } from '../../invoices/sri/sri-queue.service.js';
import { InventoryReservationService } from '../../inventory/inventory-reservation.service.js';
import { AuditLogService } from '../../audit/audit-log.service.js';
import { EventBus } from '../../event-bus/event-bus.interface.js';

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
  ) {}

  async handleWebhook(rawBody: Buffer, signature: string): Promise<void> {
    const secret = this.configService.getOrThrow<string>('STRIPE_WEBHOOK_SECRET');

    if (!this.stripeProvider.validateWebhookSignature(rawBody, signature, secret)) {
      throw new UnauthorizedException('Invalid Stripe webhook signature');
    }

    const event = JSON.parse(rawBody.toString()) as StripeEvent;

    this.logger.debug(`Received Stripe event: ${event.type} (${event.id})`);

    const alreadyProcessed = await this.isEventProcessed(event.id);
    if (alreadyProcessed) {
      this.logger.debug(`Stripe event ${event.id} already processed; skipping`);
      return;
    }

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
      default:
        this.logger.warn(`Unhandled Stripe event type: ${event.type}`);
    }
  }

  private async isEventProcessed(eventId: string): Promise<boolean> {
    const existing = await this.prisma.auditLog.findFirst({
      where: {
        resource: 'stripe-webhook',
        action: 'processed',
        resourceId: eventId,
      },
    });
    return existing != null;
  }

  private async handleCheckoutSessionCompleted(
    object: Record<string, unknown>,
    eventId: string,
  ): Promise<void> {
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

    await this.reservationService.confirm(orderId);
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

  private enqueueInvoice(orderId: string): void {
    this.sriQueue
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
}
