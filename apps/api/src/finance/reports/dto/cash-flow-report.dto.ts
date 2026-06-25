import { ApiProperty } from '@nestjs/swagger';
import { IncomeSource } from '@prisma/client';

export class CashFlowReportDto {
  @ApiProperty()
  periodStart!: Date;

  @ApiProperty()
  periodEnd!: Date;

  @ApiProperty()
  totalIncome!: number;

  @ApiProperty()
  totalExpenses!: number;

  @ApiProperty()
  netCashFlow!: number;

  @ApiProperty()
  incomeBySource!: Record<IncomeSource, number>;

  @ApiProperty()
  expensesByCategory!: Record<string, number>;
}
