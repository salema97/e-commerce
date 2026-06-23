import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import { OrderStatus, PaymentProvider as PaymentProviderEnum, PaymentStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { PaymentProviderFactory } from './payment-provider.factory.js';
import { ProviderPaymentResult } from './payment-provider.interface.js';
import { WhatsAppNotificationService } from '../whatsapp/whatsapp-notification.service.js';

@Injectable()
export class PaymentWebhookService {
  constructor(
    private readonly providerFactory: PaymentProviderFactory,
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly notificationService: WhatsAppNotificationService,
  ) {}

  async handle(
    providerName: string,
    payload: unknown,
    signature: string | undefined,
  ): Promise<ProviderPaymentResult> {
    const providerEnum = this.parseProviderName(providerName);
    const provider = this.providerFactory.getProvider(providerEnum);
    const secret = this.getProviderSecret(providerEnum);

    const rawBody = Buffer.from(JSON.stringify(payload));
    if (!provider.validateWebhookSignature(rawBody, signature ?? '', secret)) {
      throw new UnauthorizedException('Invalid webhook signature');
    }

    const result = await provider.parseWebhookPayload(payload);
    await this.applyPaymentResult(providerEnum, result);
    return result;
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
    }
  }

  private async sendStatusNotification(
    orderId: string,
    orderStatus: OrderStatus,
  ): Promise<void> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { user: { select: { whatsappOptOut: true } } },
    });

    if (!order || !order.customerPhone) {
      return;
    }

    const phone = order.customerPhone;
    const customerName = 'Cliente';
    const total = `USD ${Number(order.total).toFixed(2)}`;

    try {
      if (orderStatus === OrderStatus.PROCESSING) {
        await this.notificationService.notify(orderId, 'ORDER_CONFIRMED', phone, {
          customerName,
          orderNumber: order.orderNumber,
          total,
        });
      } else if (orderStatus === OrderStatus.PAYMENT_FAILED) {
        await this.notificationService.notify(orderId, 'PAYMENT_FAILED', phone, {
          customerName,
          orderNumber: order.orderNumber,
          total,
        });
      }
    } catch {
      // Notifications are best-effort and must not fail webhook handling.
    }
  }
}
