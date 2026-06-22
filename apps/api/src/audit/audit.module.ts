import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module.js';
import { AuditLogService } from './audit-log.service.js';
import { AuditInterceptor } from './audit.interceptor.js';

@Module({
  imports: [PrismaModule],
  providers: [AuditLogService, AuditInterceptor],
  exports: [AuditLogService, AuditInterceptor],
})
export class AuditModule {}
