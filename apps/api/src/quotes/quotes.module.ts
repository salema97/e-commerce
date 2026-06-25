import { Module, forwardRef } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module.js';
import { B2bModule } from '../b2b/b2b.module.js';
import { OrdersModule } from '../orders/orders.module.js';
import { QuotesController } from './quotes.controller.js';
import { QuotesService } from './quotes.service.js';

@Module({
  imports: [PrismaModule, forwardRef(() => B2bModule), forwardRef(() => OrdersModule)],
  controllers: [QuotesController],
  providers: [QuotesService],
  exports: [QuotesService],
})
export class QuotesModule {}
