import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ProductAnalyticsProvider } from './product-analytics-provider.interface.js';

@Injectable()
export class ConsoleProductAnalyticsProvider extends ProductAnalyticsProvider {
  private readonly logger = new Logger(ConsoleProductAnalyticsProvider.name);

  capture(
    distinctId: string,
    event: string,
    properties?: Record<string, unknown>,
  ): Promise<void> {
    this.logger.debug({ distinctId, event, properties }, 'Product analytics event');
    return Promise.resolve();
  }

  isFeatureEnabled(_flag: string, _distinctId: string): Promise<boolean> {
    return Promise.resolve(false);
  }
}

@Injectable()
export class PostHogProductAnalyticsProvider extends ProductAnalyticsProvider {
  private readonly logger = new Logger(PostHogProductAnalyticsProvider.name);
  private client: import('posthog-node').PostHog | null = null;

  constructor(private readonly config: ConfigService) {
    super();
    const apiKey = config.get<string>('POSTHOG_KEY');
    if (apiKey) {
      void this.initClient(apiKey);
    }
  }

  private async initClient(apiKey: string): Promise<void> {
    try {
      const { PostHog } = await import('posthog-node');
      this.client = new PostHog(apiKey, {
        host: this.config.get<string>('POSTHOG_HOST', 'https://us.i.posthog.com'),
      });
    } catch (error) {
      this.logger.warn({ error }, 'PostHog SDK unavailable; using console fallback');
    }
  }

  capture(
    distinctId: string,
    event: string,
    properties?: Record<string, unknown>,
  ): Promise<void> {
    if (!this.client) {
      return Promise.resolve();
    }
    this.client.capture({ distinctId, event, properties });
    return Promise.resolve();
  }

  isFeatureEnabled(flag: string, distinctId: string): Promise<boolean> {
    if (!this.client) {
      return Promise.resolve(false);
    }
    return Promise.resolve(Boolean(this.client.isFeatureEnabled(flag, distinctId)));
  }
}
