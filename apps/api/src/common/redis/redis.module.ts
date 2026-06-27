import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { RedisService } from './redis.service.js';
import { RedisIdempotencyService } from './idempotency.service.js';

/**
 * Global Redis module.
 *
 * Provides a single ioredis client that can be injected anywhere in the API.
 */
@Global()
@Module({
  imports: [ConfigModule],
  providers: [RedisService, RedisIdempotencyService],
  exports: [RedisService, RedisIdempotencyService],
})
export class RedisModule {}
