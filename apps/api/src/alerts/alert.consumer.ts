import { Injectable, Inject, Logger, OnModuleInit } from '@nestjs/common';
import type { DomainEvent } from '@repo/shared-types';
import { ALERT_EVENT_NAMES } from '@repo/shared-types';
import { EventBus } from '../event-bus/event-bus.interface.js';
import { ErrorTracker } from '../analytics/error-tracker.interface.js';

const ALERT_NAMES = new Set<DomainEvent['name']>([
  ALERT_EVENT_NAMES.SRI_DLQ,
  ALERT_EVENT_NAMES.WEBHOOK_FAILURE,
  ALERT_EVENT_NAMES.FIVE_XX_SPIKE,
]);

@Injectable()
export class AlertConsumer implements OnModuleInit {
  private readonly logger = new Logger(AlertConsumer.name);

  constructor(
    @Inject(EventBus) private readonly eventBus: EventBus,
    @Inject(ErrorTracker) private readonly errorTracker: ErrorTracker,
  ) {}

  onModuleInit(): void {
    this.eventBus.registerHandler((event) => this.handle(event));
  }

  private async handle(event: DomainEvent): Promise<void> {
    if (!ALERT_NAMES.has(event.name)) return;

    this.logger.error(
      { alert: event.name, payload: event.payload },
      'Alert event received',
    );

    this.errorTracker.captureMessage(`Alert: ${event.name}`, {
      level: 'error',
      extra: event.payload,
    });
  }
}
