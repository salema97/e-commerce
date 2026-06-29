import { Controller, Get, HttpStatus, ServiceUnavailableException } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import {
  HealthCheck,
  HealthCheckError,
  HealthCheckService,
  HealthIndicatorResult,
} from '@nestjs/terminus';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Public } from '../auth/public.decorator.js';
import { PrismaHealthIndicator } from './prisma.health.js';
import { RedisHealthIndicator } from './redis.health.js';
import { MeilisearchHealthIndicator } from './meilisearch.health.js';
import { EvolutionHealthIndicator } from './evolution.health.js';

interface ReadinessResult {
  status: 'ok' | 'error';
  info: Record<string, HealthIndicatorResult[string]>;
  error?: Record<string, unknown>;
  details?: Record<string, unknown>;
}

const HEALTH_CHECK_TIMEOUT_MS = 3_000;

@ApiTags('Health')
@Public()
@SkipThrottle()
@Controller('health')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly prismaHealth: PrismaHealthIndicator,
    private readonly redisHealth: RedisHealthIndicator,
    private readonly meilisearchHealth: MeilisearchHealthIndicator,
    private readonly evolutionHealth: EvolutionHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  @ApiOperation({ summary: 'Liveness probe' })
  @ApiResponse({ status: 200, description: 'API is alive' })
  liveness() {
    return this.health.check([]);
  }

  @Get('ready')
  @HealthCheck()
  @ApiOperation({ summary: 'Readiness probe' })
  @ApiResponse({ status: 200, description: 'All critical dependencies are healthy' })
  @ApiResponse({ status: 503, description: 'One or more critical dependencies are unavailable' })
  async readiness() {
    const result = await this.buildReadinessResult();
    if (result.status === 'error') {
      throw new HealthCheckError('Readiness check failed', result.info);
    }
    return result;
  }

  private async buildReadinessResult(): Promise<ReadinessResult> {
    const criticalIndicators = [
      () => this.withTimeout(() => this.prismaHealth.isHealthy('prisma'), 'prisma'),
      () => this.withTimeout(() => this.redisHealth.isHealthy('redis'), 'redis'),
    ];

    const softIndicators = [
      { key: 'meilisearch', indicator: this.meilisearchHealth },
      { key: 'evolution', indicator: this.evolutionHealth },
    ];

    let criticalResult: ReadinessResult;
    try {
      const check = await this.health.check(criticalIndicators);
      criticalResult = { status: 'ok', info: check.info };
    } catch (error) {
      const response =
        error instanceof HealthCheckError
          ? error.causes
          : { error: { unknown: { message: 'Health check failed' } } };
      criticalResult = {
        status: 'error',
        info: response as Record<string, unknown>,
        error: response as Record<string, unknown>,
      };
    }

    for (const { key, indicator } of softIndicators) {
      try {
        const status = await this.withTimeout(() => indicator.isHealthy(key), key);
        criticalResult.info[key] = { status: 'up', ...status[key] };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        criticalResult.info[key] = { status: 'down', mode: 'degraded', message };
      }
    }

    return criticalResult;
  }

  private async withTimeout<T>(fn: () => Promise<T>, key: string): Promise<T> {
    return Promise.race([
      fn(),
      new Promise<never>((_, reject) =>
        setTimeout(
          () => reject(new Error(`${key} health check timed out after ${HEALTH_CHECK_TIMEOUT_MS}ms`)),
          HEALTH_CHECK_TIMEOUT_MS,
        ),
      ),
    ]);
  }
}
