import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { EmailTemplate } from '@repo/shared-types';
import { PrismaService } from '../prisma/prisma.service.js';
import { RedisIdempotencyService } from '../common/redis/idempotency.service.js';
import { EmailProvider } from './email-provider.interface.js';
import type { EmailTemplateContext } from '@repo/shared-utils';

/**
 * Sends transactional emails for order, payment, and refund lifecycle events.
 * Idempotent and respects customer email opt-out.
 */
@Injectable()
export class EmailNotificationService {
  private readonly logger = new Logger(EmailNotificationService.name);

  constructor(
    private readonly emailProvider: EmailProvider,
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly idempotency: RedisIdempotencyService,
  ) {}

  async notify(
    orderId: string,
    template: EmailTemplate,
    email: string,
    context: EmailTemplateContext,
  ): Promise<void> {
    if (!this.isEnabled()) {
      this.logger.debug({ orderId, template }, 'Email notifications are disabled');
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail.includes('@')) {
      this.logger.warn({ orderId, template }, 'Invalid email for notification');
      return;
    }

    const claimed = await this.idempotency.claim(
      `email:notification:${orderId}:${template}`,
      60 * 60 * 24 * 7,
    );

    if (!claimed) {
      this.logger.debug({ orderId, template }, 'Duplicate email notification skipped');
      return;
    }

    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { user: { select: { emailOptOut: true } } },
    });

    if (!order) {
      this.logger.warn({ orderId, template }, 'Order not found for email notification');
      return;
    }

    const recipient = order.customerEmail.trim().toLowerCase() || normalizedEmail;

    if (order.user?.emailOptOut) {
      this.logger.debug({ orderId, template }, 'Customer opted out of email notifications');
      return;
    }

    const vars = this.contextToVars(context);

    try {
      await this.emailProvider.sendTemplate(recipient, template, vars);
    } catch (error) {
      this.logger.error(
        { error, orderId, template, email: maskEmail(recipient) },
        'Failed to send email notification',
      );
      throw error;
    }
  }

  private isEnabled(): boolean {
    return this.configService.get<string>('EMAIL_NOTIFICATIONS_ENABLED') !== 'false';
  }

  private contextToVars(context: EmailTemplateContext): Record<string, string> {
    const record = { ...context } as Record<string, string | undefined>;
    return Object.fromEntries(
      Object.entries(record).filter(
        (entry): entry is [string, string] => typeof entry[1] === 'string',
      ),
    );
  }
}

function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!domain) return '***';
  return `${local.slice(0, 2)}***@${domain}`;
}
