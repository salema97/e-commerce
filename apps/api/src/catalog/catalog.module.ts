import { Module } from '@nestjs/common';
import { AiModule } from '../ai/ai.module.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { RedisModule } from '../common/redis/redis.module.js';
import { EventBusModule } from '../event-bus/event-bus.module.js';
import { CatalogController } from './catalog.controller.js';
import { CatalogService } from './catalog.service.js';
import { CatalogCacheService } from './catalog-cache.service.js';
import { CatalogCacheInvalidator } from './catalog-cache.invalidator.js';

@Module({
  imports: [PrismaModule, AiModule, RedisModule, EventBusModule],
  controllers: [CatalogController],
  providers: [CatalogService, CatalogCacheService, CatalogCacheInvalidator],
  exports: [CatalogService, CatalogCacheService],
})
export class CatalogModule {}
