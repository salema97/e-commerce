import { Module } from '@nestjs/common';
import { SellersController } from './sellers.controller.js';
import { SellersService } from './sellers.service.js';
import { OrderPaidSellerConsumer } from './order-paid-seller.consumer.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { EventBusModule } from '../event-bus/event-bus.module.js';

@Module({
  imports: [PrismaModule, EventBusModule],
  controllers: [SellersController],
  providers: [SellersService, OrderPaidSellerConsumer],
  exports: [SellersService],
})
export class SellersModule {}
