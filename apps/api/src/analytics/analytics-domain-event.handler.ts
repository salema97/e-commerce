import { Injectable, OnModuleInit, Inject } from '@nestjs/common';
import { EventBus } from '../event-bus/event-bus.interface.js';
import { AnalyticsService } from './analytics.service.js';

@Injectable()
export class AnalyticsDomainEventHandler implements OnModuleInit {
  constructor(
    @Inject(EventBus) private readonly eventBus: EventBus,
    private readonly analytics: AnalyticsService,
  ) {}

  onModuleInit(): void {
    this.eventBus.registerHandler((event) => this.analytics.handleDomainEvent(event));
  }
}
