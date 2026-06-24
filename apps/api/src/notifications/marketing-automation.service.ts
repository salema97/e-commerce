import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service.js';
import { RedisService } from '../common/redis/redis.service.js';
import { RedisIdempotencyService } from '../common/redis/idempotency.service.js';
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

const WIN_BACK_BATCH_SIZE = 100;
const WIN_BACK_CURSOR_KEY = 'marketing:win-back:cursor';

@Injectable()
export class MarketingAutomationService {
  private readonly logger = new Logger(MarketingAutomationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly idempotency: RedisIdempotencyService,
    private readonly campaignEmail: CampaignEmailService,
    private readonly pushNotifications: PushNotificationService,
    private readonly marketingProvider: MarketingEmailProvider,
    private readonly segmentService: NotificationSegmentService,
    private readonly preferencesService: NotificationPreferencesService,
    private readonly configService: ConfigService,
  ) {}

  async trackPurchaseEvent(orderId: string): Promise<void> {
    const claimed = await this.idempotency.claim(
      `marketing:purchase:${orderId}`,
      60 * 60 * 24 * 30,
    );

    if (!claimed) {
      return;
    }

    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { user: { select: { id: true, email: true, marketingEmailOptOut: true } } },
    });

    if (!order?.customerEmail) {
      await this.idempotency.release(`marketing:purchase:${orderId}`);
      return;
    }

    try {
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
    } catch (error) {
      await this.idempotency.release(`marketing:purchase:${orderId}`);
      this.logger.error({ error, orderId }, 'Failed to track purchase marketing event');
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_9AM)
  async processWinBackCampaign(): Promise<void> {
    if (this.configService.get<string>('WIN_BACK_ENABLED') === 'false') {
      return;
    }

    const recipients = await this.segmentService.resolveEmails('INACTIVE_BUYERS');
    if (recipients.length === 0) {
      return;
    }

    const offset = Number((await this.redis.client.get(WIN_BACK_CURSOR_KEY)) ?? '0');
    const batch = recipients.slice(offset, offset + WIN_BACK_BATCH_SIZE);
    const nextOffset =
      offset + WIN_BACK_BATCH_SIZE >= recipients.length ? 0 : offset + WIN_BACK_BATCH_SIZE;
    await this.redis.client.set(WIN_BACK_CURSOR_KEY, String(nextOffset));

    const storefront = this.storefrontUrl();

    for (const recipient of batch) {
      const customerName =
        recipient.name?.trim() || recipient.email.split('@')[0] || 'Cliente';
      const unsubscribeToken = this.preferencesService.createUnsubscribeToken(
        recipient.userId,
        'marketing',
      );
      const unsubscribeUrl = `${this.apiPublicUrl()}/notifications/unsubscribe?token=${unsubscribeToken}&scope=marketing`;

      try {
        const sent = await this.campaignEmail.send(
          recipient.email,
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
          await this.marketingProvider.trackEvent(recipient.email, 'win_back_sent', {
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
    const storefront = this.storefrontUrl();

    for (const recipient of recipients) {
      const coupon = promotion.coupons[couponIndex];
      if (!coupon) break;
      if (coupon.usageLimit !== null && coupon.usageCount >= coupon.usageLimit) {
        couponIndex += 1;
        continue;
      }

      const customerName =
        recipient.name?.trim() || recipient.email.split('@')[0] || 'Cliente';
      const unsubscribeToken = this.preferencesService.createUnsubscribeToken(
        recipient.userId,
        'marketing',
      );
      const unsubscribeUrl = `${this.apiPublicUrl()}/notifications/unsubscribe?token=${unsubscribeToken}&scope=marketing`;

      try {
        const emailSent = await this.campaignEmail.send(
          recipient.email,
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
          await this.marketingProvider.trackEvent(
            recipient.email,
            'promo_distributed' as MarketingEventName,
            {
              promotionId,
              couponCode: coupon.code,
              segment,
            },
          );
        }
      } catch (error) {
        this.logger.error({ error, userId: recipient.userId }, 'Promo distribution failed');
      }
    }

    return { sent };
  }

  async listActivePromotions(): Promise<Array<{ id: string; name: string }>> {
    return this.prisma.promotion.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    });
  }

  private storefrontUrl(): string {
    return this.configService.get<string>('STOREFRONT_URL') ?? 'http://localhost:3000';
  }

  private apiPublicUrl(): string {
    const port = this.configService.get<string>('PORT') ?? '3001';
    return this.configService.get<string>('API_PUBLIC_URL') ?? `http://localhost:${port}/v1`;
  }
}
