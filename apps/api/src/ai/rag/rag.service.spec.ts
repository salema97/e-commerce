import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ConfigService } from '@nestjs/config';
import { RagService } from './rag.service.js';
import { EmbeddingProvider } from '../embedding/embedding-provider.interface.js';
import { PrismaService } from '../../prisma/prisma.service.js';

describe('RagService', () => {
  let service: RagService;
  const embed = vi.fn();
  const findMany = vi.fn();
  const queryRawUnsafe = vi.fn();

  beforeEach(() => {
    embed.mockReset();
    findMany.mockReset();
    queryRawUnsafe.mockReset();
    embed.mockResolvedValue([1, 0, 0]);
    queryRawUnsafe.mockResolvedValue([]);
    findMany.mockResolvedValue([
      { id: 'a', content: 'Política de devoluciones 30 días', embedding: [1, 0, 0] },
      { id: 'b', content: 'Horario de atención', embedding: [0, 1, 0] },
    ]);

    const embeddingProvider = { embed } as unknown as EmbeddingProvider;
    const prisma = {
      knowledgeChunk: { findMany },
      $queryRawUnsafe: queryRawUnsafe,
    } as unknown as PrismaService;
    const config = {
      get: (key: string, defaultValue?: string) => {
        if (key === 'KNOWLEDGE_USE_PGVECTOR') return 'false';
        return defaultValue;
      },
    } as unknown as ConfigService;
    service = new RagService(prisma, embeddingProvider, config);
  });

  it('returns chunks ranked by cosine similarity when pgvector is disabled', async () => {
    const results = await service.retrieve('devoluciones', 2);
    expect(results).toHaveLength(2);
    expect(results[0]?.id).toBe('a');
    expect(results[0]?.score).toBeGreaterThan(results[1]?.score ?? 0);
  });
});
