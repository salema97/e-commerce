import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { WhatsAppNotificationService } from '../whatsapp/whatsapp-notification.service.js';
import { EmailNotificationService } from './email-notification.service.js';
import { PushNotificationService } from './push-notification.service.js';
import { MarketingAutomationService } from './marketing-automation.service.js';
import { OrderSummaryPdfService } from '../receipts/order-summary-pdf.service.js';
import { RedisIdempotencyService } from '../common/redis/idempotency.service.js';

@Injectable()
export class OrderConfirmationService {
  private readonly logger = new Logger(OrderConfirmationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationService: WhatsAppNotificationService,
    private readonly emailNotificationService: EmailNotificationService,
    private readonly pushNotificationService: PushNotificationService,
    private readonly marketingAutomation: MarketingAutomationService,
    private readonly orderSummaryPdf: OrderSummaryPdfService,
    private readonly idempotency: RedisIdempotencyService,
  ) {}

  async sendPaidOrderNotifications(orderId: string): Promise<void> {
    const claimKey = `order-paid:confirm:${orderId}`;
    const claimed = await this.idempotency.claim(claimKey, 86_400);
    if (!claimed) {
      this.logger.debug({ orderId }, 'Paid-order notifications already sent');
      return;
    }

    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { user: { select: { whatsappOptOut: true, emailOptOut: true } } },
    });

    if (!order) {
      await this.idempotency.release(claimKey);
      return;
    }

    const context = {
      customerName: 'Cliente',
      orderNumber: order.orderNumber,
      total: `USD ${Number(order.total).toFixed(2)}`,
    };

    try {
      if (order.customerPhone) {
        await this.notificationService.notify(
          orderId,
          'ORDER_CONFIRMED',
          order.customerPhone,
          context,
        );
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
    } catch (error) {
      await this.idempotency.release(claimKey);
      this.logger.error({ error, orderId }, 'Failed to send paid-order notifications');
      throw error;
    }
  }
}
