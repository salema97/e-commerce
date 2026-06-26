import { Test, type TestingModuleBuilder } from '@nestjs/testing';
import { AppModule } from '../src/app.module.js';
import { RedisService } from '../src/common/redis/redis.service.js';
import { createTestRedisServiceMock } from './redis.mock.js';

/** Nest e2e module with in-memory Redis (throttle, cache, health). */
export function createE2eTestingModule(): TestingModuleBuilder {
  return Test.createTestingModule({ imports: [AppModule] }).overrideProvider(
    RedisService,
  ).useValue(createTestRedisServiceMock());
}
