import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TerminusModule } from '@nestjs/terminus';
import { RedisModule } from '../common/redis/redis.module.js';
import { MeilisearchService } from '../ai/search/meilisearch.service.js';
import { HealthController } from './health.controller.js';
import { PrismaHealthIndicator } from './prisma.health.js';
import { RedisHealthIndicator } from './redis.health.js';
import { MeilisearchHealthIndicator } from './meilisearch.health.js';
import { EvolutionHealthIndicator } from './evolution.health.js';

@Module({
  imports: [TerminusModule, RedisModule, ConfigModule],
  controllers: [HealthController],
  providers: [
    PrismaHealthIndicator,
    RedisHealthIndicator,
    MeilisearchService,
    MeilisearchHealthIndicator,
    EvolutionHealthIndicator,
  ],
})
export class HealthModule {}
