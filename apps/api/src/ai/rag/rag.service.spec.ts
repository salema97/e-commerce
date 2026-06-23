import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RagService } from './rag.service.js';
import { EmbeddingProvider } from '../embedding/embedding-provider.interface.js';
import { PrismaService } from '../../prisma/prisma.service.js';

describe('RagService', () => {
  let service: RagService;
  const embed = vi.fn();
  const findMany = vi.fn();

  beforeEach(() => {
    embed.mockReset();
    findMany.mockReset();
    embed.mockResolvedValue([1, 0, 0]);
    findMany.mockResolvedValue([
      { id: 'a', content: 'Política de devoluciones 30 días', embedding: [1, 0, 0] },
      { id: 'b', content: 'Horario de atención', embedding: [0, 1, 0] },
    ]);

    const embeddingProvider = { embed } as unknown as EmbeddingProvider;
    const prisma = { knowledgeChunk: { findMany } } as unknown as PrismaService;
    service = new RagService(prisma, embeddingProvider);
  });

  it('returns chunks ranked by cosine similarity', async () => {
    const results = await service.retrieve('devoluciones', 2);
    expect(results).toHaveLength(2);
    expect(results[0]?.id).toBe('a');
    expect(results[0]?.score).toBeGreaterThan(results[1]?.score ?? 0);
  });
});
