import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventBus } from './event-bus.interface.js';
import { RedisStreamsEventBus } from './redis-streams-event-bus.service.js';
import { UpstashKafkaEventBus } from './upstash-kafka-event-bus.service.js';
import { ConfiguredEventBus } from './configured-event-bus.js';
import { EventBusProviderWiring } from './event-bus-provider.wiring.js';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    RedisStreamsEventBus,
    UpstashKafkaEventBus,
    ConfiguredEventBus,
    {
      provide: EventBus,
      useExisting: ConfiguredEventBus,
    },
    EventBusProviderWiring,
  ],
  exports: [EventBus, EventBusProviderWiring],
})
export class EventBusModule {}
