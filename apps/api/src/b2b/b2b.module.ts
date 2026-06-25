import { Module, forwardRef } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module.js';
import { QuotesModule } from '../quotes/quotes.module.js';
import { B2bPricingModule } from './b2b-pricing.module.js';
import { B2bController } from './b2b.controller.js';
import { B2bService } from './b2b.service.js';

@Module({
  imports: [PrismaModule, B2bPricingModule, forwardRef(() => QuotesModule)],
  controllers: [B2bController],
  providers: [B2bService],
  exports: [B2bService, B2bPricingModule],
})
export class B2bModule {}
