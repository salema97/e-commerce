import {
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service.js';
import { StripeProvider } from './stripe.provider.js';
import { PaymentStatus } from '../entities/payment-status.enum.js';
import { OrderStatus } from '@prisma/client';
import { InvoicesService } from '../../invoices/invoices.service.js';

@Injectable()
export class StripeWebhookService {
  private readonly logger = new Logger(StripeWebhookService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly stripeProvider: StripeProvider,
    private readonly prisma: PrismaService,
    private readonly invoicesService: InvoicesService,
  ) {}

  async handleWebhook(rawBody: Buffer, signature: string): Promise<void> {
    const secret = this.configService.getOrThrow<string>('STRIPE_WEBHOOK_SECRET');

    if (!this.stripeProvider.validateWebhookSignature(rawBody, signature, secret)) {
      throw new UnauthorizedException('Invalid Stripe webhook signature');
    }

    const event = JSON.parse(rawBody.toString()) as {
      type: string;
      data: { object: Record<string, unknown> };
    };

    this.logger.debug(`Received Stripe event: ${event.type}`);

    switch (event.type) {
      case 'payment_intent.succeeded':
        await this.handlePaymentIntentSucceeded(event.data.object);
        break;
      case 'payment_intent.payment_failed':
        await this.handlePaymentIntentFailed(event.data.object);
        break;
      case 'charge.refunded':
        await this.handleChargeRefunded(event.data.object);
        break;
      default:
        this.logger.warn(`Unhandled Stripe event type: ${event.type}`);
    }
  }

  private async handlePaymentIntentSucceeded(
    object: Record<string, unknown>,
  ): Promise<void> {
    const providerTransactionId = object.id as string;
    const payment = await this.findPaymentByTransactionId(providerTransactionId);

    if (!payment) {
      this.logger.error(
        `Payment record not found for transaction ${providerTransactionId}`,
      );
      return;
    }

    const metadata = { ...(payment.metadata as Record<string, unknown>), paidAt: new Date().toISOString() };

    await this.prisma.$transaction([
      this.prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: PaymentStatus.COMPLETED,
          metadata,
        },
      }),
      this.prisma.orderStatusHistory.create({
        data: {
          orderId: payment.orderId,
          status: OrderStatus.PROCESSING,
          notes: 'Payment confirmed via Stripe',
        },
      }),
    ]);

    this.logger.log(`Payment ${payment.id} marked as COMPLETED`);

    try {
      await this.invoicesService.issueInvoiceForOrder(payment.orderId);
      this.logger.log(`Invoice auto-issued for order ${payment.orderId}`);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(
        { error: message, orderId: payment.orderId },
        'Failed to auto-issue invoice for paid order',
      );
    }
  }

  private async handlePaymentIntentFailed(
    object: Record<string, unknown>,
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

    await this.prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: PaymentStatus.FAILED,
        metadata,
      },
    });

    this.logger.log(`Payment ${payment.id} marked as FAILED`);
  }

  private async handleChargeRefunded(
    object: Record<string, unknown>,
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
        data: {
          status: PaymentStatus.REFUNDED,
          metadata,
        },
      }),
      this.prisma.orderStatusHistory.create({
        data: {
          orderId: payment.orderId,
          status: OrderStatus.REFUNDED,
          notes: 'Refund confirmed via Stripe',
        },
      }),
    ]);

    this.logger.log(`Payment ${payment.id} marked as REFUNDED`);
  }

  private findPaymentByTransactionId(providerTransactionId: string) {
    return this.prisma.payment.findFirst({
      where: { providerTransactionId },
    });
  }
}
