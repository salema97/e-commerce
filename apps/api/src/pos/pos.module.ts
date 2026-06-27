import { Module } from '@nestjs/common';
import { PosController } from './pos.controller.js';
import { PosService } from './pos.service.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { OrdersModule } from '../orders/orders.module.js';
import { InventoryModule } from '../inventory/inventory.module.js';
import { InvoicesModule } from '../invoices/invoices.module.js';
import { ReceiptsModule } from '../receipts/receipts.module.js';
import { PaymentsModule } from '../payments/payments.module.js';
import { EventBusModule } from '../event-bus/event-bus.module.js';

@Module({
  imports: [
    PrismaModule,
    OrdersModule,
    InventoryModule,
    InvoicesModule,
    ReceiptsModule,
    PaymentsModule,
    EventBusModule,
  ],
  controllers: [PosController],
  providers: [PosService],
  exports: [],
})
export class PosModule {}
