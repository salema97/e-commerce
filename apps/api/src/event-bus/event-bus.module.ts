import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EventBus } from './event-bus.interface.js';
import { RedisStreamsEventBus } from './redis-streams-event-bus.service.js';
import { UpstashKafkaEventBus } from './upstash-kafka-event-bus.service.js';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    RedisStreamsEventBus,
    UpstashKafkaEventBus,
    {
      provide: EventBus,
      useFactory: (
        config: ConfigService,
        redisBus: RedisStreamsEventBus,
        kafkaBus: UpstashKafkaEventBus,
      ) => {
        const backend = config.get<string>('EVENT_BUS_BACKEND', 'redis');
        if (backend === 'kafka') {
          return kafkaBus;
        }
        return redisBus;
      },
      inject: [ConfigService, RedisStreamsEventBus, UpstashKafkaEventBus],
    },
  ],
  exports: [EventBus],
})
export class EventBusModule {}
