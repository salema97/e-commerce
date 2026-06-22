import { Module } from '@nestjs/common';
import { ReturnsController, OrderReturnsController } from './returns.controller.js';
import { ReturnsService } from './returns.service.js';
import { StoreCreditService } from './store-credit.service.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { AuditModule } from '../audit/audit.module.js';

@Module({
  imports: [PrismaModule, AuditModule],
  controllers: [OrderReturnsController, ReturnsController],
  providers: [ReturnsService, StoreCreditService],
  exports: [ReturnsService, StoreCreditService],
})
export class ReturnsModule {}
