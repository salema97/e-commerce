import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module.js';
import { ReturnsModule } from '../returns/returns.module.js';
import { LoyaltyModule } from '../loyalty/loyalty.module.js';
import { ReferralEngine } from './referral.engine.js';
import { ReferralsService } from './referrals.service.js';
import { ReferralsController } from './referrals.controller.js';

@Module({
  imports: [PrismaModule, ReturnsModule, LoyaltyModule],
  controllers: [ReferralsController],
  providers: [ReferralEngine, ReferralsService],
  exports: [ReferralEngine, ReferralsService],
})
export class ReferralsModule {}
