import { Module } from '@nestjs/common';
import { AnalyticsModule } from '../analytics/analytics.module.js';
import { EventBusModule } from '../event-bus/event-bus.module.js';
import { AlertConsumer } from './alert.consumer.js';

@Module({
  imports: [AnalyticsModule, EventBusModule],
  providers: [AlertConsumer],
})
export class AlertsModule {}
