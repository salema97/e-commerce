import { Injectable } from '@nestjs/common';
import {
  HealthIndicator,
  HealthIndicatorResult,
  HealthCheckError,
} from '@nestjs/terminus';
import { RedisService } from '../common/redis/redis.service.js';

@Injectable()
export class RedisHealthIndicator extends HealthIndicator {
  constructor(private readonly redis: RedisService) {
    super();
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    try {
      const pong = await this.redis.client.ping();
      if (pong !== 'PONG') {
        throw new HealthCheckError(
          'Redis ping failed',
          this.getStatus(key, false, { message: `Unexpected ping response: ${pong}` }),
        );
      }
      return this.getStatus(key, true);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new HealthCheckError(
        'Redis is not reachable',
        this.getStatus(key, false, { message }),
      );
    }
  }
}
