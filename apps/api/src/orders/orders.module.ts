import { Module } from '@nestjs/common';
import { OrdersController } from './orders.controller.js';
import { OrdersService } from './orders.service.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { InventoryModule } from '../inventory/inventory.module.js';
import { PromotionsModule } from '../promotions/promotions.module.js';
import { PaymentsModule } from '../payments/payments.module.js';
import { ReceiptsModule } from '../receipts/receipts.module.js';
import { RefundsController } from './refunds.controller.js';
import { WhatsAppNotificationModule } from '../whatsapp/whatsapp-notification.module.js';
import { NotificationsModule } from '../notifications/notifications.module.js';
import { ShippingModule } from '../shipping/shipping.module.js';
import { TaxModule } from '../tax/tax.module.js';
import { LoyaltyModule } from '../loyalty/loyalty.module.js';
import { BackorderService } from './backorder.service.js';

@Module({
  imports: [
    PrismaModule,
    InventoryModule,
    PromotionsModule,
    PaymentsModule,
    ReceiptsModule,
    WhatsAppNotificationModule,
    NotificationsModule,
    ShippingModule,
    TaxModule,
    LoyaltyModule,
  ],
  controllers: [OrdersController, RefundsController],
  providers: [OrdersService, BackorderService],
})
export class OrdersModule {}
