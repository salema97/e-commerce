import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module.js';
import { AuditModule } from '../../audit/audit.module.js';
import { FinanceGiftCardsController } from './finance-gift-cards.controller.js';
import { FinanceGiftCardsService } from './finance-gift-cards.service.js';

@Module({
  imports: [PrismaModule, AuditModule],
  controllers: [FinanceGiftCardsController],
  providers: [FinanceGiftCardsService],
})
export class FinanceGiftCardsModule {}
