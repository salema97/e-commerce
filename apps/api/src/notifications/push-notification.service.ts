import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { EmailTemplate } from '@repo/shared-types';
import { renderEmailTemplate, type EmailTemplateContext } from '@repo/shared-utils';
import { PrismaService } from '../prisma/prisma.service.js';
import { RedisIdempotencyService } from '../common/redis/idempotency.service.js';
import { PushNotificationProvider } from './push-notification-provider.interface.js';

@Injectable()
export class PushNotificationService {
  private readonly logger = new Logger(PushNotificationService.name);

  constructor(
    private readonly pushProvider: PushNotificationProvider,
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly idempotency: RedisIdempotencyService,
  ) {}

  async notifyForOrder(
    orderId: string,
    userId: string | null | undefined,
    template: EmailTemplate,
    context: EmailTemplateContext,
  ): Promise<void> {
    if (!this.isEnabled() || !userId) {
      return;
    }

    const claimed = await this.idempotency.claim(
      `push:notification:${orderId}:${template}`,
      60 * 60 * 24 * 7,
    );

    if (!claimed) {
      return;
    }

    const tokens = await this.prisma.pushDeviceToken.findMany({
      where: { userId },
      select: { token: true },
    });

    if (tokens.length === 0) {
      return;
    }

    const rendered = renderEmailTemplate(template, context);

    try {
      await this.pushProvider.sendToTokens(
        tokens.map((row) => row.token),
        {
          title: rendered.subject,
          body: rendered.text.split('\n')[0] ?? rendered.subject,
          data: {
            orderId,
            template,
            url: `ecommerce://order/${orderId}`,
          },
        },
      );
    } catch (error) {
      this.logger.error({ error, orderId, template }, 'Failed to send push notification');
    }
  }

  async notifyUser(
    userId: string,
    idempotencyKey: string,
    template: EmailTemplate,
    context: EmailTemplateContext,
    deepLinkUrl: string,
    options?: { imageUrl?: string },
  ): Promise<void> {
    if (!this.isEnabled()) {
      return;
    }

    const claimed = await this.idempotency.claim(
      `push:campaign:${idempotencyKey}:${template}`,
      60 * 60 * 24 * 30,
    );

    if (!claimed) {
      return;
    }

    const tokens = await this.prisma.pushDeviceToken.findMany({
      where: { userId },
      select: { token: true },
    });

    if (tokens.length === 0) {
      return;
    }

    const rendered = renderEmailTemplate(template, context);

    try {
      await this.pushProvider.sendToTokens(
        tokens.map((row) => row.token),
        {
          title: rendered.subject,
          body: rendered.text.split('\n')[0] ?? rendered.subject,
          data: { template, url: deepLinkUrl },
          imageUrl: options?.imageUrl,
        },
      );
    } catch (error) {
      this.logger.error({ error, userId, template }, 'Failed to send campaign push notification');
    }
  }

  private isEnabled(): boolean {
    return this.configService.get<string>('PUSH_NOTIFICATIONS_ENABLED') !== 'false';
  }
}
