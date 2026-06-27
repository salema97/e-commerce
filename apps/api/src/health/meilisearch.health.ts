import { Injectable } from '@nestjs/common';
import {
  HealthIndicator,
  HealthIndicatorResult,
  HealthCheckError,
} from '@nestjs/terminus';
import { MeilisearchService } from '../ai/search/meilisearch.service.js';

@Injectable()
export class MeilisearchHealthIndicator extends HealthIndicator {
  constructor(private readonly meilisearch: MeilisearchService) {
    super();
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    if (!this.meilisearch.isEnabled) {
      return this.getStatus(key, true, { mode: 'disabled' });
    }

    try {
      const healthy = await this.meilisearch.ping();
      if (!healthy) {
        throw new HealthCheckError(
          'Meilisearch ping failed',
          this.getStatus(key, false, { mode: 'degraded' }),
        );
      }
      return this.getStatus(key, true, { mode: 'enabled' });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new HealthCheckError(
        'Meilisearch is not reachable',
        this.getStatus(key, false, { message, mode: 'degraded' }),
      );
    }
  }
}
