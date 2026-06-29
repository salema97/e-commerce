import { Module } from '@nestjs/common';
import { PromotionService } from './promotion.service.js';
import { PromotionsService } from './promotions.service.js';
import { PromotionsController } from './promotions.controller.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { TaxModule } from '../tax/tax.module.js';

@Module({
  imports: [PrismaModule, TaxModule],
  controllers: [PromotionsController],
  providers: [PromotionService, PromotionsService],
  exports: [PromotionService],
})
export class PromotionsModule {}
