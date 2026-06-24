import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service.js';
import { CampaignEmailService } from './campaign-email.service.js';
import { PushNotificationService } from './push-notification.service.js';
import { WhatsAppProvider } from '../whatsapp/whatsapp-provider.interface.js';

@Injectable()
export class BackInStockAlertsService {
  private readonly logger = new Logger(BackInStockAlertsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly campaignEmail: CampaignEmailService,
    private readonly pushNotifications: PushNotificationService,
    private readonly whatsappProvider: WhatsAppProvider,
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

    return this.prisma.backInStockAlert.upsert({
      where: {
        productId_email: { productId, email: normalizedEmail },
      },
      create: { productId, email: normalizedEmail },
      update: { isNotified: false },
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

    const productUrl = `${this.storefrontBaseUrl()}/store/${product.slug}`;
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

          const user = await this.prisma.user.findFirst({
            where: { email: alert.email },
            select: { id: true, phone: true, name: true },
          });

          if (user) {
            await this.pushNotifications.notifyUser(
              user.id,
              `back-in-stock:${alert.id}`,
              'BACK_IN_STOCK',
              {
                customerName,
                productName: product.name,
                productUrl,
              },
              `ecommerce://product/${product.slug}`,
            );

            if (user.phone) {
              try {
                await this.whatsappProvider.sendText(
                  user.phone,
                  `¡Buenas noticias! ${product.name} ya está disponible: ${productUrl}`,
                );
              } catch (error) {
                this.logger.error({ error, alertId: alert.id }, 'Back-in-stock WhatsApp failed');
              }
            }
          }
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
  }

  private storefrontBaseUrl(): string {
    return (
      this.configService.get<string>('STOREFRONT_URL') ??
      this.configService.get<string>('STRIPE_SUCCESS_URL')?.replace(/\/checkout\/success.*$/, '') ??
      'http://localhost:3000'
    );
  }
}
