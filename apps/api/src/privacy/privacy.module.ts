import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module.js';
import { UsersModule } from '../users/users.module.js';
import { PrivacyController } from './privacy.controller.js';
import { PrivacyService } from './privacy.service.js';

@Module({
  imports: [PrismaModule, UsersModule],
  controllers: [PrivacyController],
  providers: [PrivacyService],
  exports: [],
})
export class PrivacyModule {}
