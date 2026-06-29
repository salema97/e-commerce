import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Test } from '@nestjs/testing';
import { TerminusModule, HealthCheckError } from '@nestjs/terminus';
import { HealthController } from './health.controller.js';
import { PrismaHealthIndicator } from './prisma.health.js';
import { RedisHealthIndicator } from './redis.health.js';
import { MeilisearchHealthIndicator } from './meilisearch.health.js';
import { EvolutionHealthIndicator } from './evolution.health.js';

describe('HealthController', () => {
  let controller: HealthController;
  let prismaHealth: { isHealthy: ReturnType<typeof vi.fn> };
  let redisHealth: { isHealthy: ReturnType<typeof vi.fn> };
  let meilisearchHealth: { isHealthy: ReturnType<typeof vi.fn> };
  let evolutionHealth: { isHealthy: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    prismaHealth = { isHealthy: vi.fn().mockResolvedValue({ prisma: { status: 'up' } }) };
    redisHealth = { isHealthy: vi.fn().mockResolvedValue({ redis: { status: 'up' } }) };
    meilisearchHealth = { isHealthy: vi.fn().mockResolvedValue({ meilisearch: { status: 'up', mode: 'enabled' } }) };
    evolutionHealth = { isHealthy: vi.fn().mockResolvedValue({ evolution: { status: 'up' } }) };

    const module = await Test.createTestingModule({
      imports: [TerminusModule],
      controllers: [HealthController],
      providers: [
        { provide: PrismaHealthIndicator, useValue: prismaHealth },
        { provide: RedisHealthIndicator, useValue: redisHealth },
        { provide: MeilisearchHealthIndicator, useValue: meilisearchHealth },
        { provide: EvolutionHealthIndicator, useValue: evolutionHealth },
      ],
    }).compile();

    controller = module.get(HealthController);
  });

  it('liveness returns ok', async () => {
    const result = await controller.liveness();
    expect(result.status).toBe('ok');
  });

  it('readiness returns ok when all dependencies are healthy', async () => {
    const result = await controller.readiness();
    expect(result.status).toBe('ok');
    expect(result.info.prisma).toMatchObject({ status: 'up' });
    expect(result.info.redis).toMatchObject({ status: 'up' });
    expect(result.info.meilisearch).toMatchObject({ status: 'up', mode: 'enabled' });
    expect(result.info.evolution).toMatchObject({ status: 'up' });
  });

  it('readiness throws when a critical dependency is down', async () => {
    prismaHealth.isHealthy.mockRejectedValueOnce(new Error('Prisma down'));

    await expect(controller.readiness()).rejects.toBeInstanceOf(HealthCheckError);
  });

  it('readiness stays ok when a soft dependency is degraded', async () => {
    meilisearchHealth.isHealthy.mockRejectedValueOnce(new Error('Meilisearch timeout'));

    const result = await controller.readiness();
    expect(result.status).toBe('ok');
    expect(result.info.meilisearch).toMatchObject({ status: 'down', mode: 'degraded' });
  });
});
