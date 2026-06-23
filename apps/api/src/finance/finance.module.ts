import { Module } from '@nestjs/common';
import { IncomesModule } from './incomes/incomes.module.js';
import { ExpenseCategoriesModule } from './expense-categories/expense-categories.module.js';

@Module({
  imports: [IncomesModule, ExpenseCategoriesModule],
  exports: [IncomesModule, ExpenseCategoriesModule],
})
export class FinanceModule {}
