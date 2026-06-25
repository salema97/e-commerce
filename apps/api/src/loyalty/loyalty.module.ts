import { Module, forwardRef } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module.js';
import { LoyaltyEngine } from './loyalty.engine.js';
import { LoyaltyService } from './loyalty.service.js';
import { LoyaltyController } from './loyalty.controller.js';

@Module({
  imports: [PrismaModule],
  controllers: [LoyaltyController],
  providers: [LoyaltyEngine, LoyaltyService],
  exports: [LoyaltyEngine, LoyaltyService],
})
export class LoyaltyModule {}
