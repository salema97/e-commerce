import { Module } from '@nestjs/common';
import { PromotionService } from './promotion.service.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { TaxModule } from '../tax/tax.module.js';

@Module({
  imports: [PrismaModule, TaxModule],
  providers: [PromotionService],
  exports: [PromotionService],
})
export class PromotionsModule {}
