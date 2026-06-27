import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module.js';
import { AuditModule } from '../../audit/audit.module.js';
import { FinanceStoreCreditsController } from './finance-store-credits.controller.js';
import { FinanceStoreCreditsService } from './finance-store-credits.service.js';

@Module({
  imports: [PrismaModule, AuditModule],
  controllers: [FinanceStoreCreditsController],
  providers: [FinanceStoreCreditsService],
})
export class FinanceStoreCreditsModule {}
