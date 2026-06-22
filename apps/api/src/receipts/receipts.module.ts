import { Module } from '@nestjs/common';
import { ReceiptService } from './receipt.service.js';
import { PrismaModule } from '../prisma/prisma.module.js';

@Module({
  imports: [PrismaModule],
  providers: [ReceiptService],
  exports: [ReceiptService],
})
export class ReceiptsModule {}
