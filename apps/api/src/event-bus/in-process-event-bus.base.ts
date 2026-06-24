import { Logger } from '@nestjs/common';
import type { DomainEvent } from '@repo/shared-types';
import { DomainEventHandler, EventBus } from './event-bus.interface.js';

export abstract class InProcessEventBus extends EventBus {
  protected readonly logger = new Logger(InProcessEventBus.name);
  private readonly handlers: DomainEventHandler[] = [];

  registerHandler(handler: DomainEventHandler): void {
    this.handlers.push(handler);
  }

  protected async dispatchHandlers(event: DomainEvent): Promise<void> {
    for (const handler of this.handlers) {
      try {
        await handler(event);
      } catch (error) {
        this.logger.error({ error, event: event.name }, 'Domain event handler failed');
      }
    }
  }

  protected serializeEvent(event: DomainEvent): string {
    return JSON.stringify({
      ...event,
      occurredAt: event.occurredAt ?? new Date().toISOString(),
    });
  }

  protected abstract persist(event: DomainEvent, payload: string): Promise<void>;

  async publish(event: DomainEvent): Promise<void> {
    const payload = this.serializeEvent(event);
    await this.persist(event, payload);
    await this.dispatchHandlers(event);
  }
}
