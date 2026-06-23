import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { DomainEvent } from '@repo/shared-types';
import { RedisService } from '../common/redis/redis.service.js';
import { InProcessEventBus } from './in-process-event-bus.base.js';

export const DOMAIN_EVENTS_STREAM = 'domain-events';

@Injectable()
export class RedisStreamsEventBus extends InProcessEventBus {
  constructor(
    private readonly redis: RedisService,
    private readonly config: ConfigService,
  ) {
    super();
  }

  protected async persist(event: DomainEvent, payload: string): Promise<void> {
    if (this.config.get<string>('EVENT_BUS_ENABLED', 'true') !== 'true') {
      return;
    }

    try {
      await this.redis.client.xadd(
        DOMAIN_EVENTS_STREAM,
        '*',
        'name',
        event.name,
        'payload',
        payload,
      );
    } catch (error) {
      this.logger.warn({ error, event: event.name }, 'Failed to append domain event to Redis stream');
    }
  }
}
