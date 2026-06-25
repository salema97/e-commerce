import { Injectable } from '@nestjs/common';
import {
  ConfiguredErrorTracker,
  ConfiguredProductAnalyticsProvider,
} from './configured-analytics.providers.js';
import { PrismaAnalyticsEventStore } from './prisma-analytics-event-store.service.js';

@Injectable()
export class AnalyticsProviderWiring {
  constructor(
    private readonly productAnalytics: ConfiguredProductAnalyticsProvider,
    private readonly errorTracker: ConfiguredErrorTracker,
    private readonly eventStore: PrismaAnalyticsEventStore,
  ) {}
}
