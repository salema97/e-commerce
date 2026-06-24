import { createHash } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { CatalogResponse } from '@repo/shared-types';
import { RedisService } from '../common/redis/redis.service.js';
import type { CatalogQueryDto } from './dto/catalog-query.dto.js';

const CACHE_PREFIX = 'catalog:query:';

@Injectable()
export class CatalogCacheService {
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
    const raw = await this.redis.client.get(key);
    if (!raw) {
      return null;
    }
    return JSON.parse(raw) as CatalogResponse;
  }

  async set(key: string, value: CatalogResponse): Promise<void> {
    await this.redis.client.set(key, JSON.stringify(value), 'EX', this.ttlSeconds);
  }

  async invalidateCatalogQueries(): Promise<void> {
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
  }
}
