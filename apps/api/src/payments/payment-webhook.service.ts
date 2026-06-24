import { Injectable, BadRequestException, UnauthorizedException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import { OrderStatus, PaymentProvider as PaymentProviderEnum, PaymentStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { PaymentProviderFactory } from './payment-provider.factory.js';
import { ProviderPaymentResult } from './payment-provider.interface.js';
import { WhatsAppNotificationService } from '../whatsapp/whatsapp-notification.service.js';
import { EmailNotificationService } from '../notifications/email-notification.service.js';
import { PushNotificationService } from '../notifications/push-notification.service.js';
import { MarketingAutomationService } from '../notifications/marketing-automation.service.js';
import { InvoicesService } from '../invoices/invoices.service.js';
import { OrderSummaryPdfService } from '../receipts/order-summary-pdf.service.js';

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
    private readonly marketingAutomation: MarketingAutomationService,
    private readonly orderSummaryPdf: OrderSummaryPdfService,
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
      throw new UnauthorizedException('Invalid webhook signature');
    }

    const payload = this.parseRawBody(rawBody);
    const result = await provider.parseWebhookPayload(payload);
    await this.applyPaymentResult(providerEnum, result);
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
        return '';
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

    await this.prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: result.status,
        providerMetadata: (result.metadata ?? {}) as Prisma.InputJsonValue,
      },
    });

    if (orderStatus) {
      await this.prisma.order.update({
        where: { id: payment.orderId },
        data: { status: orderStatus },
      });
      await this.prisma.orderStatusHistory.create({
        data: {
          orderId: payment.orderId,
          status: orderStatus,
          notes: `Payment notification from ${provider}`,
        },
      });
      await this.sendStatusNotification(payment.orderId, orderStatus);

      if (orderStatus === OrderStatus.PROCESSING) {
        this.enqueueInvoice(payment.orderId);
      }
    }
  }

  private enqueueInvoice(orderId: string): void {
    this.invoicesService
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
        const context = {
          customerName,
          orderNumber: order.orderNumber,
          total,
        };
        if (phone) {
          await this.notificationService.notify(orderId, 'ORDER_CONFIRMED', phone, context);
        }
        if (order.customerEmail) {
          const attachment = await this.orderSummaryPdf.buildEmailAttachment(
            orderId,
            order.orderNumber,
          );
          await this.emailNotificationService.notify(
            orderId,
            'ORDER_CONFIRMED',
            order.customerEmail,
            context,
            { attachments: attachment ? [attachment] : undefined },
          );
        }
        await this.pushNotificationService.notifyForOrder(
          orderId,
          order.userId,
          'ORDER_CONFIRMED',
          context,
        );
        await this.marketingAutomation.trackPurchaseEvent(orderId);
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
