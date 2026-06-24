import { Module, forwardRef } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module.js';
import { QuotesModule } from '../quotes/quotes.module.js';
import { B2bController } from './b2b.controller.js';
import { B2bService } from './b2b.service.js';
import { B2bPricingService } from './b2b-pricing.service.js';

@Module({
  imports: [PrismaModule, forwardRef(() => QuotesModule)],
  controllers: [B2bController],
  providers: [B2bService, B2bPricingService],
  exports: [B2bService, B2bPricingService],
})
export class B2bModule {}
