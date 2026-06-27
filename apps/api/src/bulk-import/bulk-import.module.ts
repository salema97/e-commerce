import { Module } from '@nestjs/common';
import { AiModule } from '../ai/ai.module.js';
import { BulkImportController } from './bulk-import.controller.js';
import { ProductsCsvImportService } from './products-csv-import.service.js';

@Module({
  imports: [AiModule],
  controllers: [BulkImportController],
  providers: [ProductsCsvImportService],
})
export class BulkImportModule {}
