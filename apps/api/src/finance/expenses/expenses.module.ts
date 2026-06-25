import { Module } from '@nestjs/common';
import { StorageModule } from '../../storage/storage.module.js';
import { ExpensesController } from './expenses.controller.js';
import { ExpensesService } from './expenses.service.js';
import { ExpenseReceiptStorageService } from './expense-receipt-storage.service.js';

@Module({
  imports: [StorageModule],
  controllers: [ExpensesController],
  providers: [ExpensesService, ExpenseReceiptStorageService],
  exports: [ExpensesService],
})
export class ExpensesModule {}
