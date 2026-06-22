import { Module } from '@nestjs/common';
import { PromotionService } from './promotion.service.js';
import { PrismaModule } from '../prisma/prisma.module.js';

@Module({
  imports: [PrismaModule],
  providers: [PromotionService],
  exports: [PromotionService],
})
export class PromotionsModule {}
