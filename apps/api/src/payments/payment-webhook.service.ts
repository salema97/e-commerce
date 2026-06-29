import { Injectable, BadRequestException, UnauthorizedException, Logger, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import { OrderStatus, PaymentProvider as PaymentProviderEnum, PaymentStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { RedisIdempotencyService } from '../common/redis/idempotency.service.js';
import { PaymentProviderFactory } from './payment-provider.factory.js';
import { ProviderPaymentResult } from './payment-provider.interface.js';
import { WhatsAppNotificationService } from '../whatsapp/whatsapp-notification.service.js';
import { EmailNotificationService } from '../notifications/email-notification.service.js';
import { PushNotificationService } from '../notifications/push-notification.service.js';
import { InvoicesService } from '../invoices/invoices.service.js';
import { EventBus } from '../event-bus/event-bus.interface.js';

const PROVIDER_IDEMPOTENCY_TTL_SECONDS: Record<PaymentProviderEnum, number> = {
  [PaymentProviderEnum.STRIPE]: 86_400,
  [PaymentProviderEnum.KUSHKI]: 86_400,
  [PaymentProviderEnum.PAYPHONE]: 43_200,
  [PaymentProviderEnum.MERCADOPAGO]: 86_400,
  [PaymentProviderEnum.PLACETOPAY]: 43_200,
  [PaymentProviderEnum.CASH]: 86_400,
};

@Injectable()
export class PaymentWebhookService {
  private readonly logger = new Logger(PaymentWebhookService.name);

  constructor(
    private readonly providerFactory: PaymentProviderFactory,
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly notificationService: WhatsAppNotificationService,
    private readonly emailNotificationService: EmailNotificationService,
    private readonly pushNotificationService: PushNotificationService,
    private readonly invoicesService: InvoicesService,
    @Inject(EventBus) private readonly eventBus: EventBus,
    private readonly idempotency: RedisIdempotencyService,
  ) {}

  async handle(
    providerName: string,
    rawBody: Buffer,
    signature: string | undefined,
  ): Promise<ProviderPaymentResult> {
    const providerEnum = this.parseProviderName(providerName);
    const provider = this.providerFactory.getProvider(providerEnum);
    const secret = this.getProviderSecret(providerEnum);

    if (!provider.validateWebhookSignature(rawBody, signature ?? '', secret)) {
      void this.eventBus.publish({
        name: 'alert.webhook_failure',
        payload: {
          provider: providerEnum,
          reason: 'invalid_signature',
          message: 'Invalid webhook signature',
        },
      });
      throw new UnauthorizedException('Invalid webhook signature');
    }

    const payload = this.parseRawBody(rawBody);
    const result = await provider.parseWebhookPayload(payload);

    const transactionId = result.providerTransactionId;
    if (transactionId) {
      const idempotencyKey = `${providerEnum}:${transactionId}`;
      const ttl = PROVIDER_IDEMPOTENCY_TTL_SECONDS[providerEnum] ?? 86_400;
      const claimed = await this.idempotency.claim(idempotencyKey, ttl);
      if (!claimed) {
        this.logger.debug(`Webhook ${providerEnum}:${transactionId} already processed; skipping`);
        return result;
      }

      try {
        await this.applyPaymentResult(providerEnum, result);
      } catch (error) {
        await this.idempotency.release(idempotencyKey);
        void this.eventBus.publish({
          name: 'alert.webhook_failure',
          payload: {
            provider: providerEnum,
            transactionId,
            reason: 'processing_error',
            message: error instanceof Error ? error.message : String(error),
          },
        });
        throw error;
      }
    } else {
      this.logger.warn(`Webhook from ${providerEnum} has no transaction id; skipping idempotency`);
      await this.applyPaymentResult(providerEnum, result);
    }

    return result;
  }

  private parseRawBody(rawBody: Buffer): unknown {
    try {
      return JSON.parse(rawBody.toString('utf8'));
    } catch {
      throw new BadRequestException('Webhook body is not valid JSON');
    }
  }

  private parseProviderName(name: string): PaymentProviderEnum {
    const normalized = name.toUpperCase();
    if (Object.values(PaymentProviderEnum).includes(normalized as PaymentProviderEnum)) {
      return normalized as PaymentProviderEnum;
    }
    throw new BadRequestException(`Unsupported payment provider: ${name}`);
  }

  private getProviderSecret(provider: PaymentProviderEnum): string {
    switch (provider) {
      case PaymentProviderEnum.KUSHKI:
        return this.configService.getOrThrow<string>('KUSHKI_WEBHOOK_SECRET');
      case PaymentProviderEnum.PAYPHONE:
        return this.configService.getOrThrow<string>('PAYPHONE_TOKEN');
      case PaymentProviderEnum.MERCADOPAGO:
        return this.configService.getOrThrow<string>('MERCADOPAGO_WEBHOOK_SECRET');
      case PaymentProviderEnum.PLACETOPAY:
        return this.configService.getOrThrow<string>('PLACETOPAY_SECRET_KEY');
      default:
        throw new BadRequestException(`Webhook secret not configured for provider ${provider}`);
    }
  }

  private async applyPaymentResult(
    provider: PaymentProviderEnum,
    result: ProviderPaymentResult,
  ): Promise<void> {
    if (!result.providerTransactionId) return;

    const payment = await this.prisma.payment.findFirst({
      where: {
        provider,
        providerTransactionId: result.providerTransactionId,
      },
    });

    if (!payment) return;

    let orderStatus: OrderStatus | undefined;
    if (result.status === PaymentStatus.COMPLETED) orderStatus = OrderStatus.PROCESSING;
    if (result.status === PaymentStatus.FAILED) orderStatus = OrderStatus.PAYMENT_FAILED;

    await this.prisma.$transaction(async (tx) => {
      await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: result.status,
          providerMetadata: (result.metadata ?? {}) as Prisma.InputJsonValue,
        },
      });

      if (orderStatus) {
        await tx.order.update({
          where: { id: payment.orderId },
          data: { status: orderStatus },
        });
        await tx.orderStatusHistory.create({
          data: {
            orderId: payment.orderId,
            status: orderStatus,
            notes: `Payment notification from ${provider}`,
          },
        });
      }
    });

    if (orderStatus) {
      await this.sendStatusNotification(payment.orderId, orderStatus);

      if (orderStatus === OrderStatus.PROCESSING) {
        this.enqueueInvoice(payment.orderId);
      }
    }
  }

  private enqueueInvoice(orderId: string): void {
    void this.invoicesService
      .enqueueInvoiceForOrder(orderId)
      .catch((error: unknown) => {
        const message = error instanceof Error ? error.message : String(error);
        this.logger.error(
          { error: message, orderId },
          'Failed to enqueue SRI invoice job from payment webhook',
        );
      });
  }

  private async sendStatusNotification(
    orderId: string,
    orderStatus: OrderStatus,
  ): Promise<void> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { user: { select: { whatsappOptOut: true, emailOptOut: true } } },
    });

    if (!order) {
      return;
    }

    const phone = order.customerPhone;
    const customerName = 'Cliente';
    const total = `USD ${Number(order.total).toFixed(2)}`;

    try {
      if (orderStatus === OrderStatus.PROCESSING) {
        void this.eventBus.publish({ name: 'order.paid', payload: { orderId } });
      } else if (orderStatus === OrderStatus.PAYMENT_FAILED) {
        const context = {
          customerName,
          orderNumber: order.orderNumber,
          total,
        };
        if (phone) {
          await this.notificationService.notify(orderId, 'PAYMENT_FAILED', phone, context);
        }
        if (order.customerEmail) {
          await this.emailNotificationService.notify(
            orderId,
            'PAYMENT_FAILED',
            order.customerEmail,
            context,
          );
        }
        await this.pushNotificationService.notifyForOrder(
          orderId,
          order.userId,
          'PAYMENT_FAILED',
          context,
        );
      }
    } catch {
      // Notifications are best-effort and must not fail webhook handling.
    }
  }
}
