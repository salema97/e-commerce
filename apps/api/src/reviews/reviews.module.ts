import { Module } from '@nestjs/common';
import { AiModule } from '../ai/ai.module.js';
import { LoyaltyModule } from '../loyalty/loyalty.module.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { ReviewsController } from './reviews.controller.js';
import { ReviewsService } from './reviews.service.js';
import { ExternalReviewsService } from './external-reviews.service.js';

@Module({
  imports: [PrismaModule, AiModule, LoyaltyModule],
  controllers: [ReviewsController],
  providers: [ReviewsService, ExternalReviewsService],
  exports: [],
})
export class ReviewsModule {}
