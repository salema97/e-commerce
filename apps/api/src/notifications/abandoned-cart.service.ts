import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service.js';
import { CampaignEmailService } from './campaign-email.service.js';
import { PushNotificationService } from './push-notification.service.js';
import { MarketingEmailProvider } from './marketing-email-provider.interface.js';

@Injectable()
export class AbandonedCartService {
  private readonly logger = new Logger(AbandonedCartService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly campaignEmail: CampaignEmailService,
    private readonly pushNotifications: PushNotificationService,
    private readonly marketingProvider: MarketingEmailProvider,
    private readonly configService: ConfigService,
  ) {}

  @Cron(CronExpression.EVERY_HOUR)
  async processAbandonedCarts(): Promise<void> {
    if (this.configService.get<string>('ABANDONED_CART_ENABLED') === 'false') {
      return;
    }

    const hours = Number(this.configService.get<string>('ABANDONED_CART_REMINDER_HOURS') ?? '24');
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);

    const carts = await this.prisma.cart.findMany({
      where: {
        userId: { not: null },
        abandonedReminderSentAt: null,
        updatedAt: { lt: cutoff },
        items: { some: {} },
      },
      include: {
        items: true,
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            marketingEmailOptOut: true,
          },
        },
      },
      take: 50,
    });

    for (const cart of carts) {
      if (!cart.userId || !cart.user?.email) {
        continue;
      }

      const itemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);
      if (itemCount === 0) {
        continue;
      }

      const customerName =
        cart.user.name?.trim() || cart.user.email.split('@')[0] || 'Cliente';

      const cartUrl = `${this.storefrontBaseUrl()}/cart`;

      try {
        const sent = await this.campaignEmail.send(
          cart.user.email,
          'ABANDONED_CART',
          {
            customerName,
            itemCount: String(itemCount),
            cartUrl,
          },
          `abandoned-cart:${cart.id}`,
          { userId: cart.userId, respectMarketingOptOut: true },
        );

        if (sent) {
          await this.prisma.cart.update({
            where: { id: cart.id },
            data: { abandonedReminderSentAt: new Date() },
          });

          await this.pushNotifications.notifyUser(
            cart.userId,
            `abandoned-cart:${cart.id}`,
            'ABANDONED_CART',
            {
              customerName,
              itemCount: String(itemCount),
              cartUrl,
            },
            'ecommerce://cart',
          );
          await this.marketingProvider.trackEvent(cart.user.email, 'abandoned_cart', {
            cartId: cart.id,
            itemCount,
          });
        }
      } catch (error) {
        this.logger.error({ error, cartId: cart.id }, 'Failed to process abandoned cart');
      }
    }
  }

  private storefrontBaseUrl(): string {
    return (
      this.configService.get<string>('STOREFRONT_URL') ??
      this.configService.get<string>('STRIPE_SUCCESS_URL')?.replace(/\/checkout\/success.*$/, '') ??
      'http://localhost:3000'
    );
  }
}
