import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { EmailTemplate } from '@repo/shared-types';
import type { EmailTemplateContext } from '@repo/shared-utils';
import { PrismaService } from '../prisma/prisma.service.js';
import { RedisIdempotencyService } from '../common/redis/idempotency.service.js';
import { EmailProvider } from './email-provider.interface.js';

export interface CampaignEmailOptions {
  userId?: string | null;
  /** When true, skips users who opted out of marketing emails. */
  respectMarketingOptOut?: boolean;
}

/**
 * Sends non-order lifecycle emails (abandoned cart, back-in-stock, etc.).
 */
@Injectable()
export class CampaignEmailService {
  private readonly logger = new Logger(CampaignEmailService.name);

  constructor(
    private readonly emailProvider: EmailProvider,
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly idempotency: RedisIdempotencyService,
  ) {}

  async send(
    email: string,
    template: EmailTemplate,
    context: EmailTemplateContext,
    idempotencyKey: string,
    options: CampaignEmailOptions = {},
  ): Promise<boolean> {
    if (!this.isEnabled()) {
      return false;
    }

    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail.includes('@')) {
      this.logger.warn({ template, idempotencyKey }, 'Invalid email for campaign');
      return false;
    }

    const claimed = await this.idempotency.claim(
      `email:campaign:${idempotencyKey}:${template}`,
      60 * 60 * 24 * 30,
    );

    if (!claimed) {
      return false;
    }

    if (options.respectMarketingOptOut && options.userId) {
      const user = await this.prisma.user.findUnique({
        where: { id: options.userId },
        select: { marketingEmailOptOut: true },
      });

      if (user?.marketingEmailOptOut) {
        this.logger.debug({ userId: options.userId, template }, 'Marketing email opt-out');
        return false;
      }
    }

    const vars = this.contextToVars(context);

    try {
      await this.emailProvider.sendTemplate(normalizedEmail, template, vars);
      return true;
    } catch (error) {
      this.logger.error(
        { error, template, idempotencyKey, email: maskEmail(normalizedEmail) },
        'Failed to send campaign email',
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
