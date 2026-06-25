import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ErrorTracker, type ErrorReportContext } from './error-tracker.interface.js';
import { ConsoleErrorTracker, SentryErrorTracker } from './error-trackers.js';
import { ProductAnalyticsProvider } from './product-analytics-provider.interface.js';
import {
  ConsoleProductAnalyticsProvider,
  PostHogProductAnalyticsProvider,
} from './product-analytics-providers.js';

@Injectable()
export class ConfiguredProductAnalyticsProvider extends ProductAnalyticsProvider {
  private readonly delegate: ProductAnalyticsProvider;

  constructor(
    config: ConfigService,
    consoleProvider: ConsoleProductAnalyticsProvider,
    posthogProvider: PostHogProductAnalyticsProvider,
  ) {
    super();
    const provider = config.get<string>('PRODUCT_ANALYTICS_PROVIDER', 'console');
    this.delegate =
      provider === 'posthog' && config.get<string>('POSTHOG_KEY')
        ? posthogProvider
        : consoleProvider;
  }

  capture(
    distinctId: string,
    event: string,
    properties?: Record<string, unknown>,
  ): Promise<void> {
    return this.delegate.capture(distinctId, event, properties);
  }

  isFeatureEnabled(flag: string, distinctId: string): Promise<boolean> {
    return this.delegate.isFeatureEnabled(flag, distinctId);
  }
}

@Injectable()
export class ConfiguredErrorTracker extends ErrorTracker {
  private readonly delegate: ErrorTracker;

  constructor(
    config: ConfigService,
    consoleTracker: ConsoleErrorTracker,
    sentryTracker: SentryErrorTracker,
  ) {
    super();
    this.delegate = config.get<string>('SENTRY_DSN') ? sentryTracker : consoleTracker;
  }

  captureException(error: unknown, context?: ErrorReportContext): void {
    this.delegate.captureException(error, context);
  }

  captureMessage(message: string, context?: ErrorReportContext): void {
    this.delegate.captureMessage(message, context);
  }
}
