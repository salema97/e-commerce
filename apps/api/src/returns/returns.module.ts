import { Module } from '@nestjs/common';
import { ReturnsController, OrderReturnsController } from './returns.controller.js';
import { ReturnsService } from './returns.service.js';
import { StoreCreditService } from './store-credit.service.js';
import { ReturnNotificationService } from './notifications/return-notification.service.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { AuditModule } from '../audit/audit.module.js';
import { PaymentsModule } from '../payments/payments.module.js';
import { InvoicesModule } from '../invoices/invoices.module.js';
import { WhatsAppNotificationModule } from '../whatsapp/whatsapp-notification.module.js';
import { NotificationsModule } from '../notifications/notifications.module.js';

@Module({
  imports: [
    PrismaModule,
    AuditModule,
    PaymentsModule,
    InvoicesModule,
    WhatsAppNotificationModule,
    NotificationsModule,
  ],
  controllers: [OrderReturnsController, ReturnsController],
  providers: [ReturnsService, StoreCreditService, ReturnNotificationService],
  exports: [ReturnsService, StoreCreditService, ReturnNotificationService],
})
export class ReturnsModule {}
