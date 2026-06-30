import { Injectable, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventBusModule } from '../event-bus/event-bus.module.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { AnalyticsController } from './analytics.controller.js';
import { AnalyticsService } from './analytics.service.js';
import { AnalyticsEventStore } from './analytics-event-store.interface.js';
import { PrismaAnalyticsEventStore } from './prisma-analytics-event-store.service.js';
import { ProductAnalyticsProvider } from './product-analytics-provider.interface.js';
import {
  ConsoleProductAnalyticsProvider,
  PostHogProductAnalyticsProvider,
} from './product-analytics-providers.js';
import { ErrorTracker } from './error-tracker.interface.js';
import { ConsoleErrorTracker, SentryErrorTracker } from './error-trackers.js';
import {
  ConfiguredErrorTracker,
  ConfiguredProductAnalyticsProvider,
} from './configured-analytics.providers.js';
import { AnalyticsProviderWiring } from './analytics-provider.wiring.js';

@Module({
  imports: [ConfigModule, PrismaModule, EventBusModule],
  controllers: [AnalyticsController],
  providers: [
    AnalyticsService,
    ConsoleProductAnalyticsProvider,
    PostHogProductAnalyticsProvider,
    ConsoleErrorTracker,
    SentryErrorTracker,
    PrismaAnalyticsEventStore,
    ConfiguredProductAnalyticsProvider,
    ConfiguredErrorTracker,
    {
      provide: AnalyticsEventStore,
      useExisting: PrismaAnalyticsEventStore,
    },
    {
      provide: ProductAnalyticsProvider,
      useExisting: ConfiguredProductAnalyticsProvider,
    },
    {
      provide: ErrorTracker,
      useExisting: ConfiguredErrorTracker,
    },
    AnalyticsProviderWiring,
  ],
  exports: [ErrorTracker],
})
export class AnalyticsModule {}
