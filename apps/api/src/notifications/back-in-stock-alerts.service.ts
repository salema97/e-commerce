import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service.js';
import { CampaignEmailService } from './campaign-email.service.js';
import { PushNotificationService } from './push-notification.service.js';

@Injectable()
export class BackInStockAlertsService {
  private readonly logger = new Logger(BackInStockAlertsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly campaignEmail: CampaignEmailService,
    private readonly pushNotifications: PushNotificationService,
    private readonly configService: ConfigService,
  ) {}

  async subscribe(productId: string, email: string) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      select: { id: true },
    });

    if (!product) {
      throw new NotFoundException(`Product with id ${productId} not found`);
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existing = await this.prisma.backInStockAlert.findFirst({
      where: { productId, email: normalizedEmail, isNotified: false },
    });

    if (existing) {
      return existing;
    }

    return this.prisma.backInStockAlert.create({
      data: { productId, email: normalizedEmail },
    });
  }

  async notifyRestocked(productId: string): Promise<void> {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      select: { id: true, name: true, slug: true },
    });

    if (!product) {
      return;
    }

    const alerts = await this.prisma.backInStockAlert.findMany({
      where: { productId, isNotified: false },
    });

    if (alerts.length === 0) {
      return;
    }

    const productUrl = `${this.storefrontBaseUrl()}/product/${product.slug}`;
    const notifiedIds: string[] = [];

    for (const alert of alerts) {
      const customerName = alert.email.split('@')[0] ?? 'Cliente';

      try {
        const sent = await this.campaignEmail.send(
          alert.email,
          'BACK_IN_STOCK',
          {
            customerName,
            productName: product.name,
            productUrl,
          },
          `back-in-stock:${alert.id}`,
        );

        if (sent) {
          notifiedIds.push(alert.id);
        }
      } catch (error) {
        this.logger.error(
          { error, alertId: alert.id, productId },
          'Failed to send back-in-stock email',
        );
      }
    }

    if (notifiedIds.length > 0) {
      await this.prisma.backInStockAlert.updateMany({
        where: { id: { in: notifiedIds } },
        data: { isNotified: true },
      });
    }

    const userIds = await this.prisma.user.findMany({
      where: {
        email: { in: alerts.map((alert) => alert.email) },
      },
      select: { id: true },
    });

    await Promise.all(
      userIds.map((user) =>
        this.pushNotifications.notifyUser(
          user.id,
          `back-in-stock:${productId}`,
          'BACK_IN_STOCK',
          {
            customerName: 'Cliente',
            productName: product.name,
            productUrl,
          },
          `ecommerce://product/${product.id}`,
        ),
      ),
    );
  }

  private storefrontBaseUrl(): string {
    return (
      this.configService.get<string>('STOREFRONT_URL') ??
      this.configService.get<string>('STRIPE_SUCCESS_URL')?.replace(/\/checkout\/success.*$/, '') ??
      'http://localhost:3000'
    );
  }
}
