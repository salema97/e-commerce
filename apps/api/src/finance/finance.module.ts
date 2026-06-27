import { Module } from '@nestjs/common';
import { IncomesModule } from './incomes/incomes.module.js';
import { ExpenseCategoriesModule } from './expense-categories/expense-categories.module.js';
import { ExpensesModule } from './expenses/expenses.module.js';
import { FinanceReportsModule } from './reports/finance-reports.module.js';
import { FinanceStoreCreditsModule } from './store-credits/finance-store-credits.module.js';
import { FinanceGiftCardsModule } from './gift-cards/finance-gift-cards.module.js';

@Module({
  imports: [
    IncomesModule,
    ExpenseCategoriesModule,
    ExpensesModule,
    FinanceReportsModule,
    FinanceStoreCreditsModule,
    FinanceGiftCardsModule,
  ],
  exports: [
    IncomesModule,
    ExpenseCategoriesModule,
    ExpensesModule,
    FinanceReportsModule,
  ],
})
export class FinanceModule {}
