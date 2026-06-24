import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { DomainEvent } from '@repo/shared-types';
import { InProcessEventBus } from './in-process-event-bus.base.js';

export const DEFAULT_KAFKA_DOMAIN_TOPIC = 'domain-events';

@Injectable()
export class UpstashKafkaEventBus extends InProcessEventBus {
  private producer: {
    produce: (topic: string, message: string, options?: { key?: string }) => Promise<unknown>;
  } | null = null;

  constructor(private readonly config: ConfigService) {
    super();
    void this.initProducer();
  }

  private async initProducer(): Promise<void> {
    const url = this.config.get<string>('KAFKA_URL');
    const username = this.config.get<string>('KAFKA_USERNAME');
    const password = this.config.get<string>('KAFKA_PASSWORD');
    if (!url || !username || !password) {
      return;
    }

    try {
      const { Kafka } = await import('@upstash/kafka');
      const kafka = new Kafka({ url, username, password });
      this.producer = kafka.producer();
    } catch (error) {
      this.logger.warn({ error }, 'Upstash Kafka producer unavailable; in-process handlers only');
    }
  }

  protected async persist(event: DomainEvent, payload: string): Promise<void> {
    if (this.config.get<string>('EVENT_BUS_ENABLED', 'true') !== 'true') {
      return;
    }

    if (!this.producer) {
      this.logger.debug({ event: event.name }, 'Kafka producer not configured; skipping persist');
      return;
    }

    const topic = this.config.get<string>('KAFKA_DOMAIN_EVENTS_TOPIC', DEFAULT_KAFKA_DOMAIN_TOPIC);
    try {
      await this.producer.produce(topic, payload, { key: event.name });
    } catch (error) {
      this.logger.warn({ error, event: event.name }, 'Failed to publish domain event to Kafka');
    }
  }
}
