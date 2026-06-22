import { Module } from '@nestjs/common';
import { OrdersController } from './orders.controller.js';
import { OrdersService } from './orders.service.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { InventoryModule } from '../inventory/inventory.module.js';
import { PromotionsModule } from '../promotions/promotions.module.js';
import { PaymentsModule } from '../payments/payments.module.js';
import { ReceiptsModule } from '../receipts/receipts.module.js';
import { RefundsController } from './refunds.controller.js';

@Module({
  imports: [
    PrismaModule,
    InventoryModule,
    PromotionsModule,
    PaymentsModule,
    ReceiptsModule,
  ],
  controllers: [OrdersController, RefundsController],
  providers: [OrdersService],
})
export class OrdersModule {}
