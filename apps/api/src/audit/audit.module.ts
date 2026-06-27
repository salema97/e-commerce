import { Global, Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module.js';
import { AuditLogService } from './audit-log.service.js';
import { AuditInterceptor } from './audit.interceptor.js';
import { AuditBeforeStateRegistry } from './audit-before-state.registry.js';

@Global()
@Module({
  imports: [PrismaModule],
  providers: [AuditLogService, AuditInterceptor, AuditBeforeStateRegistry],
  exports: [AuditLogService],
})
export class AuditModule {}
