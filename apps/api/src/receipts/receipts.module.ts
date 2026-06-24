import { Module } from '@nestjs/common';
import { ReceiptService } from './receipt.service.js';
import { OrderSummaryPdfService } from './order-summary-pdf.service.js';
import { PrismaModule } from '../prisma/prisma.module.js';

@Module({
  imports: [PrismaModule],
  providers: [ReceiptService, OrderSummaryPdfService],
  exports: [ReceiptService, OrderSummaryPdfService],
})
export class ReceiptsModule {}
