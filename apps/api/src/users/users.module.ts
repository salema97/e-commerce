import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../prisma/prisma.module.js';
import { UsersController } from './users.controller.js';
import { UsersService } from './users.service.js';
import { UserProvisioningService } from './user-provisioning.service.js';

@Module({
  imports: [ConfigModule, PrismaModule],
  controllers: [UsersController],
  providers: [UsersService, UserProvisioningService],
  exports: [UsersService, UserProvisioningService],
})
export class UsersModule {}
