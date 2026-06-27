import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ConfigService } from '@nestjs/config';
import { HealthCheckError } from '@nestjs/terminus';
import { EvolutionHealthIndicator } from './evolution.health.js';

describe('EvolutionHealthIndicator', () => {
  const config = {
    getOrThrow: vi.fn((key: string) => {
      const values: Record<string, string> = {
        EVOLUTION_API_URL: 'http://localhost:8080',
        EVOLUTION_API_KEY: 'test-key',
        EVOLUTION_INSTANCE_NAME: 'ecommerce',
      };
      return values[key];
    }),
  } as unknown as ConfigService;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('reports up when Evolution API and instance state respond', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => {
        if (url.endsWith('/')) {
          return new Response(JSON.stringify({ version: '2.3.7' }), { status: 200 });
        }
        return new Response(JSON.stringify({ instance: { state: 'open' } }), { status: 200 });
      }),
    );

    const indicator = new EvolutionHealthIndicator(config);
    const result = await indicator.isHealthy('evolution');

    expect(result.evolution.status).toBe('up');
    expect(result.evolution).toMatchObject({
      version: '2.3.7',
      instance: 'ecommerce',
      whatsappState: 'open',
    });
  });

  it('throws when Evolution API root is unreachable', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('down', { status: 503 })),
    );

    const indicator = new EvolutionHealthIndicator(config);
    await expect(indicator.isHealthy('evolution')).rejects.toBeInstanceOf(HealthCheckError);
  });
});
