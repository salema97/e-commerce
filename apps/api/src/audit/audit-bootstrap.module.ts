import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module.js';
import { AuditResourceRegistrationService } from './audit-resource-registration.service.js';

@Module({
  imports: [PrismaModule],
  providers: [AuditResourceRegistrationService],
})
export class AuditBootstrapModule {}
