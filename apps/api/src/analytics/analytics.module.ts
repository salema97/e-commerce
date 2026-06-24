import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EventBusModule } from '../event-bus/event-bus.module.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { AnalyticsController } from './analytics.controller.js';
import { AnalyticsService } from './analytics.service.js';
import { AnalyticsDomainEventHandler } from './analytics-domain-event.handler.js';
import { AnalyticsEventStore } from './analytics-event-store.interface.js';
import { PrismaAnalyticsEventStore } from './prisma-analytics-event-store.service.js';
import { ProductAnalyticsProvider } from './product-analytics-provider.interface.js';
import {
  ConsoleProductAnalyticsProvider,
  PostHogProductAnalyticsProvider,
} from './product-analytics-providers.js';
import { ErrorTracker } from './error-tracker.interface.js';
import { ConsoleErrorTracker, SentryErrorTracker } from './error-trackers.js';

@Module({
  imports: [ConfigModule, PrismaModule, EventBusModule],
  controllers: [AnalyticsController],
  providers: [
    AnalyticsService,
    AnalyticsDomainEventHandler,
    ConsoleProductAnalyticsProvider,
    PostHogProductAnalyticsProvider,
    ConsoleErrorTracker,
    SentryErrorTracker,
    {
      provide: AnalyticsEventStore,
      useClass: PrismaAnalyticsEventStore,
    },
    {
      provide: ProductAnalyticsProvider,
      useFactory: (
        config: ConfigService,
        consoleProvider: ConsoleProductAnalyticsProvider,
        posthogProvider: PostHogProductAnalyticsProvider,
      ) => {
        const provider = config.get<string>('PRODUCT_ANALYTICS_PROVIDER', 'console');
        if (provider === 'posthog' && config.get<string>('POSTHOG_KEY')) {
          return posthogProvider;
        }
        return consoleProvider;
      },
      inject: [ConfigService, ConsoleProductAnalyticsProvider, PostHogProductAnalyticsProvider],
    },
    {
      provide: ErrorTracker,
      useFactory: (config: ConfigService, consoleTracker: ConsoleErrorTracker, sentryTracker: SentryErrorTracker) => {
        if (config.get<string>('SENTRY_DSN')) {
          return sentryTracker;
        }
        return consoleTracker;
      },
      inject: [ConfigService, ConsoleErrorTracker, SentryErrorTracker],
    },
  ],
  exports: [AnalyticsService, ErrorTracker, ProductAnalyticsProvider],
})
export class AnalyticsModule {}
