import { Module } from '@nestjs/common';
import { EventBusModule } from '../event-bus/event-bus.module.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { LoyaltyModule } from '../loyalty/loyalty.module.js';
import { ReferralsModule } from '../referrals/referrals.module.js';
import { ReviewsModule } from '../reviews/reviews.module.js';
import { OrderPaidEngagementConsumer } from './order-paid-engagement.consumer.js';

@Module({
  imports: [PrismaModule, EventBusModule, LoyaltyModule, ReferralsModule],
  providers: [OrderPaidEngagementConsumer],
})
export class EngagementModule {}
