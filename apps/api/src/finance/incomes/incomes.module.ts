import { Module } from '@nestjs/common';
import { IncomesController } from './incomes.controller.js';
import { IncomesService } from './incomes.service.js';

@Module({
  controllers: [IncomesController],
  providers: [IncomesService],
  exports: [IncomesService],
})
export class IncomesModule {}
