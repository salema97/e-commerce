import { Injectable } from '@nestjs/common';
import type { ThrottlerStorage } from '@nestjs/throttler';
import { RedisService } from '../redis/redis.service.js';

type ThrottlerStorageRecord = {
  totalHits: number;
  timeToExpire: number;
  isBlocked: boolean;
  timeToBlockExpire: number;
};

@Injectable()
export class RedisThrottlerStorage implements ThrottlerStorage {
  constructor(private readonly redis: RedisService) {}

  async increment(
    key: string,
    ttl: number,
    limit: number,
    blockDuration: number,
    throttlerName: string,
  ): Promise<ThrottlerStorageRecord> {
    const hitKey = `throttle:${throttlerName}:${key}`;
    const blockKey = `${hitKey}:blocked`;

    const blocked = await this.redis.client.get(blockKey);
    if (blocked) {
      const blockTtl = await this.redis.client.pttl(blockKey);
      return {
        totalHits: limit + 1,
        timeToExpire: 0,
        isBlocked: true,
        timeToBlockExpire: Math.ceil(Math.max(blockTtl, 0) / 1000),
      };
    }

    const totalHits = await this.redis.client.incr(hitKey);
    if (totalHits === 1) {
      await this.redis.client.pexpire(hitKey, ttl);
    }

    const timeToExpire = Math.ceil(
      Math.max(await this.redis.client.pttl(hitKey), 0) / 1000,
    );

    if (totalHits > limit) {
      await this.redis.client.set(blockKey, '1', 'PX', blockDuration);
      return {
        totalHits,
        timeToExpire,
        isBlocked: true,
        timeToBlockExpire: Math.ceil(blockDuration / 1000),
      };
    }

    return {
      totalHits,
      timeToExpire,
      isBlocked: false,
      timeToBlockExpire: 0,
    };
  }
}
