import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../prisma/prisma.module.js';
import { ClerkJwtGuard } from './clerk-jwt.guard.js';
import { RolesGuard } from './roles.guard.js';

@Module({
  imports: [ConfigModule, PrismaModule],
  providers: [ClerkJwtGuard, RolesGuard],
  exports: [ClerkJwtGuard, RolesGuard],
})
export class AuthModule {}
