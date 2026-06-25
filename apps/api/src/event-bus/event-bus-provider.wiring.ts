import { Injectable } from '@nestjs/common';
import { ConfiguredEventBus } from './configured-event-bus.js';

@Injectable()
export class EventBusProviderWiring {
  constructor(private readonly eventBus: ConfiguredEventBus) {}
}
