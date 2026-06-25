import { Module } from '@nestjs/common';
import { FinanceStoreCreditsController } from './finance-store-credits.controller.js';
import { FinanceStoreCreditsService } from './finance-store-credits.service.js';

@Module({
  controllers: [FinanceStoreCreditsController],
  providers: [FinanceStoreCreditsService],
})
export class FinanceStoreCreditsModule {}
