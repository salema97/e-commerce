import { Module } from '@nestjs/common';
import { DropshipController } from './dropship.controller.js';
import { DropshipService, OrderPaidDropshipConsumer } from './dropship.service.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { FulfillmentModule } from '../fulfillment/fulfillment.module.js';
import { EventBusModule } from '../event-bus/event-bus.module.js';

@Module({
  imports: [PrismaModule, FulfillmentModule, EventBusModule],
  controllers: [DropshipController],
  providers: [DropshipService, OrderPaidDropshipConsumer],
  exports: [],
})
export class DropshipModule {}
