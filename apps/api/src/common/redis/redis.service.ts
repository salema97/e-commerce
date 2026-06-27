import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';
import { setDistributedCircuitBreakerRedis } from '../resilience/distributed-circuit-breaker.js';

/**
 * Thin wrapper around an ioredis client.
 *
 * The client is created from REDIS_URL and exposed so other services can
 * perform Redis operations without importing ioredis directly.
 */
@Injectable()
export class RedisService implements OnModuleDestroy, OnModuleInit {
  private readonly logger = new Logger(RedisService.name);
  readonly client: Redis;

  constructor(private readonly configService: ConfigService) {
    const redisUrl = this.configService.getOrThrow<string>('REDIS_URL');
    this.client = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      enableReadyCheck: false,
    });

    this.client.on('error', (error: Error) => {
      this.logger.error({ error }, 'Redis connection error');
    });
  }

  onModuleInit(): void {
    setDistributedCircuitBreakerRedis(this.client);
  }

  async onModuleDestroy(): Promise<void> {
    try {
      if (
        this.client.status === 'ready' ||
        this.client.status === 'connect' ||
        this.client.status === 'connecting' ||
        this.client.status === 'reconnecting'
      ) {
        await this.client.quit();
      }
    } catch {
      // Ignore disconnect errors during shutdown; the client may already be closed.
    }
  }
}
