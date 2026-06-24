import { Controller, Get, Query } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { FinanceReportsService } from './finance-reports.service.js';
import { CashFlowReportDto } from './dto/cash-flow-report.dto.js';
import { Roles } from '../../auth/roles.decorator.js';
import { Role } from '../../auth/role.enum.js';

import { FINANCE_ROLES } from '../finance.constants.js';

@ApiTags('Finance — Reports')
@ApiBearerAuth()
@Controller('finance/reports')
export class FinanceReportsController {
  constructor(private readonly reportsService: FinanceReportsService) {}

  @Get('cash-flow')
  @Roles(...FINANCE_ROLES)
  @ApiOperation({ summary: 'Cash-flow report for a date range' })
  @ApiQuery({ name: 'from', required: true })
  @ApiQuery({ name: 'to', required: true })
  getCashFlow(
    @Query('from') from: string,
    @Query('to') to: string,
  ): Promise<CashFlowReportDto> {
    return this.reportsService.getCashFlow(new Date(from), new Date(to));
  }
}
