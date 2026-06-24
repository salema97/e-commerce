import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  MarketingEmailProvider,
  type MarketingContactProfile,
} from '../marketing-email-provider.interface.js';

@Injectable()
export class LoopsMarketingEmailProvider extends MarketingEmailProvider {
  private readonly logger = new Logger(LoopsMarketingEmailProvider.name);

  constructor(private readonly config: ConfigService) {
    super();
  }

  async trackEvent(
    email: string,
    event: string,
    properties?: Record<string, string | number | boolean | undefined>,
  ): Promise<void> {
    const apiKey = this.config.get<string>('LOOPS_API_KEY');
    if (!apiKey) {
      throw new Error('LOOPS_API_KEY is required when MARKETING_EMAIL_PROVIDER=loops');
    }

    const response = await fetch('https://app.loops.so/api/v1/events/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        eventName: event,
        eventProperties: properties ?? {},
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      this.logger.error({ email, event, body }, 'Loops event tracking failed');
      throw new Error(`Loops API error (${response.status})`);
    }
  }

  async syncContact(email: string, profile: MarketingContactProfile): Promise<void> {
    const apiKey = this.config.get<string>('LOOPS_API_KEY');
    if (!apiKey) {
      throw new Error('LOOPS_API_KEY is required when MARKETING_EMAIL_PROVIDER=loops');
    }

    const response = await fetch('https://app.loops.so/api/v1/contacts/update', {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        userId: profile.userId,
        subscribed: profile.marketingOptOut ? false : true,
        customFields: {
          lastOrderAt: profile.lastOrderAt,
          totalSpent: profile.totalSpent,
          tags: profile.tags?.join(','),
        },
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      this.logger.error({ email, body }, 'Loops contact sync failed');
      throw new Error(`Loops API error (${response.status})`);
    }
  }
}
