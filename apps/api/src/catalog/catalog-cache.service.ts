import { createHash } from 'node:crypto';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { CatalogResponse } from '@repo/shared-types';
import { RedisService } from '../common/redis/redis.service.js';
import type { CatalogQueryDto } from './dto/catalog-query.dto.js';

const CACHE_PREFIX = 'catalog:query:';

@Injectable()
export class CatalogCacheService {
  private readonly logger = new Logger(CatalogCacheService.name);

  constructor(
    private readonly redis: RedisService,
    private readonly config: ConfigService,
  ) {}

  private get ttlSeconds(): number {
    return this.config.get<number>('CATALOG_CACHE_TTL_SECONDS', 120);
  }

  buildKey(query: CatalogQueryDto): string {
    const normalized = JSON.stringify(query, Object.keys(query).sort());
    const hash = createHash('sha256').update(normalized).digest('hex').slice(0, 24);
    return `${CACHE_PREFIX}${hash}`;
  }

  async get(key: string): Promise<CatalogResponse | null> {
    try {
      const raw = await this.redis.client.get(key);
      if (!raw) {
        return null;
      }
      return JSON.parse(raw) as CatalogResponse;
    } catch (error) {
      this.logger.warn({ error, key }, 'Catalog cache read failed');
      return null;
    }
  }

  async set(key: string, value: CatalogResponse): Promise<void> {
    try {
      await this.redis.client.set(key, JSON.stringify(value), 'EX', this.ttlSeconds);
    } catch (error) {
      this.logger.warn({ error, key }, 'Catalog cache write failed');
    }
  }

  async invalidateCatalogQueries(): Promise<void> {
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
      this.logger.warn({ error }, 'Catalog cache invalidation failed');
    }
  }
}
