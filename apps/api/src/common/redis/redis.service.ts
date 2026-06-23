import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';

/**
 * Thin wrapper around an ioredis client.
 *
 * The client is created from REDIS_URL and exposed so other services can
 * perform Redis operations without importing ioredis directly.
 */
@Injectable()
export class RedisService implements OnModuleDestroy {
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

  async onModuleDestroy(): Promise<void> {
    if (this.client.status === 'ready' || this.client.status === 'connect' || this.client.status === 'connecting' || this.client.status === 'reconnecting') {
      await this.client.quit();
    }
  }
}
