import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { ActivePlacementsResponse } from '@repo/shared-types';
import type { ActiveMarketingPlatform } from '@repo/shared-types';
import { RedisService } from '../common/redis/redis.service.js';

const CACHE_PREFIX = 'marketing:placements:';

@Injectable()
export class MarketingPlacementCacheService {
  private readonly logger = new Logger(MarketingPlacementCacheService.name);

  constructor(
    private readonly redis: RedisService,
    private readonly config: ConfigService,
  ) {}

  private get ttlSeconds(): number {
    return this.config.get<number>('MARKETING_PLACEMENT_CACHE_TTL_SECONDS', 90);
  }

  buildKey(platform: 'WEB' | 'MOBILE'): string {
    return `${CACHE_PREFIX}${platform}`;
  }

  async get(platform: 'WEB' | 'MOBILE'): Promise<ActivePlacementsResponse | null> {
    try {
      const raw = await this.redis.client.get(this.buildKey(platform));
      if (!raw) {
        return null;
      }
      return JSON.parse(raw) as ActivePlacementsResponse;
    } catch (error) {
      this.logger.warn({ error, platform }, 'Marketing placement cache read failed');
      return null;
    }
  }

  async set(platform: 'WEB' | 'MOBILE', value: ActivePlacementsResponse): Promise<void> {
    try {
      await this.redis.client.set(
        this.buildKey(platform),
        JSON.stringify(value),
        'EX',
        this.ttlSeconds,
      );
    } catch (error) {
      this.logger.warn({ error, platform }, 'Marketing placement cache write failed');
    }
  }

  async invalidateAll(): Promise<void> {
    try {
      const stream = this.redis.client.scanStream({ match: `${CACHE_PREFIX}*`, count: 100 });
      const keys: string[] = [];

      await new Promise<void>((resolve, reject) => {
        stream.on('data', (batch: string[]) => keys.push(...batch));
        stream.on('end', () => resolve());
        stream.on('error', reject);
      });

      if (keys.length > 0) {
        await this.redis.client.del(...keys);
      }
    } catch (error) {
      this.logger.warn({ error }, 'Marketing placement cache invalidation failed');
    }
  }
}
