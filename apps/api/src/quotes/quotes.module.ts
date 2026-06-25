import { Module, forwardRef } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module.js';
import { B2bPricingModule } from '../b2b/b2b-pricing.module.js';
import { OrdersModule } from '../orders/orders.module.js';
import { QuotesController } from './quotes.controller.js';
import { QuotesService } from './quotes.service.js';

@Module({
  imports: [PrismaModule, B2bPricingModule, forwardRef(() => OrdersModule)],
  controllers: [QuotesController],
  providers: [QuotesService],
  exports: [QuotesService],
})
export class QuotesModule {}
