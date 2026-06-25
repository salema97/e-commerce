import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module.js';
import { B2bPricingService } from './b2b-pricing.service.js';

@Module({
  imports: [PrismaModule],
  providers: [B2bPricingService],
  exports: [B2bPricingService],
})
export class B2bPricingModule {}
