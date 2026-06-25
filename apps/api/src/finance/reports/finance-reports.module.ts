import { Module } from '@nestjs/common';
import { FinanceReportsController } from './finance-reports.controller.js';
import { FinanceReportsService } from './finance-reports.service.js';

@Module({
  controllers: [FinanceReportsController],
  providers: [FinanceReportsService],
  exports: [FinanceReportsService],
})
export class FinanceReportsModule {}
