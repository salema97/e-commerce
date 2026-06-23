import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../prisma/prisma.module.js';
import { ClerkJwtGuard } from './clerk-jwt.guard.js';
import { RolesGuard } from './roles.guard.js';
import { AuthController } from './auth.controller.js';

@Module({
  imports: [ConfigModule, PrismaModule],
  controllers: [AuthController],
  providers: [ClerkJwtGuard, RolesGuard],
  exports: [ClerkJwtGuard, RolesGuard],
})
export class AuthModule {}
