import { Module } from '@nestjs/common';
import { SubscriptionsController } from './subscriptions.controller.js';
import { SubscriptionsService } from './subscriptions.service.js';
import { StripeBillingService } from './stripe-billing.service.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { PaymentsModule } from '../payments/payments.module.js';

@Module({
  imports: [PrismaModule, PaymentsModule],
  controllers: [SubscriptionsController],
  providers: [SubscriptionsService, StripeBillingService],
  exports: [],
})
export class SubscriptionsModule {}
