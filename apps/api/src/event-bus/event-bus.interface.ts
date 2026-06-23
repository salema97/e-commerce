import type { DomainEvent } from '@repo/shared-types';

export type DomainEventHandler = (event: DomainEvent) => Promise<void>;

export abstract class EventBus {
  abstract publish(event: DomainEvent): Promise<void>;
  abstract registerHandler(handler: DomainEventHandler): void;
}
