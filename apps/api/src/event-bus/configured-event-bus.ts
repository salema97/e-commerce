import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventBus } from './event-bus.interface.js';
import { RedisStreamsEventBus } from './redis-streams-event-bus.service.js';
import { UpstashKafkaEventBus } from './upstash-kafka-event-bus.service.js';

@Injectable()
export class ConfiguredEventBus extends EventBus {
  private readonly delegate: EventBus;

  constructor(
    config: ConfigService,
    redisBus: RedisStreamsEventBus,
    kafkaBus: UpstashKafkaEventBus,
  ) {
    super();
    const backend = config.get<string>('EVENT_BUS_BACKEND', 'redis');
    this.delegate = backend === 'kafka' ? kafkaBus : redisBus;
  }

  publish(event: Parameters<EventBus['publish']>[0]): Promise<void> {
    return this.delegate.publish(event);
  }

  registerHandler(handler: Parameters<EventBus['registerHandler']>[0]): void {
    this.delegate.registerHandler(handler);
  }
}
