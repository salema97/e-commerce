import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service.js';
import { CampaignEmailService } from './campaign-email.service.js';
import { PushNotificationService } from './push-notification.service.js';
import {
  MarketingEmailProvider,
  type MarketingEventName,
} from './marketing-email-provider.interface.js';
import {
  NotificationSegmentService,
  type MarketingSegment,
} from './notification-segment.service.js';
import { NotificationPreferencesService } from './notification-preferences.service.js';

@Injectable()
export class MarketingAutomationService {
  private readonly logger = new Logger(MarketingAutomationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly campaignEmail: CampaignEmailService,
    private readonly pushNotifications: PushNotificationService,
    private readonly marketingProvider: MarketingEmailProvider,
    private readonly segmentService: NotificationSegmentService,
    private readonly preferencesService: NotificationPreferencesService,
    private readonly configService: ConfigService,
  ) {}

  async trackPurchaseEvent(orderId: string): Promise<void> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { user: { select: { id: true, email: true, marketingEmailOptOut: true } } },
    });

    if (!order?.customerEmail) {
      return;
    }

    await this.marketingProvider.trackEvent(
      order.customerEmail,
      'purchase_completed',
      {
        orderId,
        orderNumber: order.orderNumber,
        total: Number(order.total),
        userId: order.userId ?? undefined,
      },
    );

    if (order.userId && order.user) {
      await this.marketingProvider.syncContact(order.customerEmail, {
        userId: order.userId,
        lastOrderAt: order.createdAt.toISOString(),
        totalSpent: Number(order.total),
        marketingOptOut: order.user.marketingEmailOptOut,
      });
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_9AM)
  async processWinBackCampaign(): Promise<void> {
    if (this.configService.get<string>('WIN_BACK_ENABLED') === 'false') {
      return;
    }

    const recipients = await this.segmentService.resolveEmails('INACTIVE_BUYERS');
    const storefront = this.storefrontUrl();

    for (const recipient of recipients.slice(0, 100)) {
      const user = await this.prisma.user.findUnique({
        where: { id: recipient.userId },
        select: { name: true, email: true },
      });
      if (!user) continue;

      const customerName = user.name?.trim() || user.email.split('@')[0] || 'Cliente';
      const unsubscribeToken = this.preferencesService.createUnsubscribeToken(
        recipient.userId,
        'marketing',
      );
      const unsubscribeUrl = `${this.apiPublicUrl()}/notifications/unsubscribe?token=${unsubscribeToken}&scope=marketing`;

      try {
        const sent = await this.campaignEmail.send(
          user.email,
          'WIN_BACK',
          {
            customerName,
            storefrontUrl: storefront,
            unsubscribeUrl,
          },
          `win-back:${recipient.userId}`,
          { userId: recipient.userId, respectMarketingOptOut: true },
        );

        if (sent) {
          await this.marketingProvider.trackEvent(user.email, 'win_back_sent', {
            userId: recipient.userId,
          });
          await this.pushNotifications.notifyUser(
            recipient.userId,
            `win-back:${recipient.userId}`,
            'WIN_BACK',
            { customerName, storefrontUrl: storefront, unsubscribeUrl },
            'ecommerce://store',
            { imageUrl: `${storefront}/og-image.png` },
          );
        }
      } catch (error) {
        this.logger.error({ error, userId: recipient.userId }, 'Win-back campaign failed');
      }
    }
  }

  async distributePromoToSegment(
    segment: MarketingSegment,
    promotionId: string,
  ): Promise<{ sent: number }> {
    const promotion = await this.prisma.promotion.findUnique({
      where: { id: promotionId, isActive: true },
      include: {
        coupons: {
          where: { isActive: true },
          orderBy: { usageCount: 'asc' },
          take: 200,
        },
      },
    });

    if (!promotion) {
      return { sent: 0 };
    }

    const recipients = await this.segmentService.resolveEmails(segment);
    let sent = 0;
    let couponIndex = 0;

    for (const recipient of recipients) {
      const coupon = promotion.coupons[couponIndex];
      if (!coupon) break;
      if (coupon.usageLimit !== null && coupon.usageCount >= coupon.usageLimit) {
        couponIndex += 1;
        continue;
      }

      const user = await this.prisma.user.findUnique({
        where: { id: recipient.userId },
        select: { name: true, email: true },
      });
      if (!user) continue;

      const customerName = user.name?.trim() || user.email.split('@')[0] || 'Cliente';
      const storefront = this.storefrontUrl();
      const unsubscribeToken = this.preferencesService.createUnsubscribeToken(
        recipient.userId,
        'marketing',
      );
      const unsubscribeUrl = `${this.apiPublicUrl()}/notifications/unsubscribe?token=${unsubscribeToken}&scope=marketing`;

      try {
        const emailSent = await this.campaignEmail.send(
          user.email,
          'PROMO_CODE',
          {
            customerName,
            promoCode: coupon.code,
            promotionName: promotion.name,
            storefrontUrl: storefront,
            unsubscribeUrl,
          },
          `promo:${promotionId}:${recipient.userId}:${coupon.code}`,
          { userId: recipient.userId, respectMarketingOptOut: true },
        );

        if (emailSent) {
          sent += 1;
          couponIndex += 1;
          await this.marketingProvider.trackEvent(user.email, 'promo_distributed' as MarketingEventName, {
            promotionId,
            couponCode: coupon.code,
            segment,
          });
        }
      } catch (error) {
        this.logger.error({ error, userId: recipient.userId }, 'Promo distribution failed');
      }
    }

    return { sent };
  }

  private storefrontUrl(): string {
    return this.configService.get<string>('STOREFRONT_URL') ?? 'http://localhost:3000';
  }

  private apiPublicUrl(): string {
    const port = this.configService.get<string>('PORT') ?? '3001';
    return this.configService.get<string>('API_PUBLIC_URL') ?? `http://localhost:${port}/v1`;
  }
}
