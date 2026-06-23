import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ProductContentAiService } from './product-content-ai.service.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { LlmProvider } from '../llm/llm-provider.interface.js';
import { LlmGuardrailsService } from '../llm/llm-guardrails.service.js';

describe('ProductContentAiService', () => {
  let service: ProductContentAiService;
  const prisma = {
    product: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    productContentDraft: {
      upsert: vi.fn(),
      findUnique: vi.fn(),
      delete: vi.fn(),
    },
    productImage: {
      findMany: vi.fn().mockResolvedValue([]),
    },
  };

  beforeEach(() => {
    vi.resetAllMocks();
    prisma.product.findUnique.mockResolvedValue({
      id: 'p1',
      name: 'Sample',
      description: 'Old',
      attributes: [],
      images: [],
      category: { name: 'Cat' },
    });
    prisma.productContentDraft.upsert.mockResolvedValue({
      id: 'd1',
      productId: 'p1',
      description: 'New copy',
    });
    prisma.productContentDraft.findUnique.mockResolvedValue({
      id: 'd1',
      productId: 'p1',
      description: 'New copy',
      metaTitle: 'Title',
      metaDescription: 'Meta',
      imageAlts: [],
    });
    prisma.product.update.mockResolvedValue({ id: 'p1', description: 'New copy' });
    prisma.productContentDraft.delete.mockResolvedValue({ id: 'd1' });

    const llm = {
      complete: vi.fn().mockResolvedValue({
        text: '{"description":"New copy","metaTitle":"Title","metaDescription":"Meta","imageAlts":[]}',
        confidence: 0.9,
      }),
    } as unknown as LlmProvider;
    const guardrails = {
      sanitizeMessages: vi.fn((messages: unknown) => messages),
    } as unknown as LlmGuardrailsService;

    service = new ProductContentAiService(prisma as unknown as PrismaService, llm, guardrails);
  });

  it('creates a draft without publishing product fields', async () => {
    await service.generateDraft('p1');
    expect(prisma.productContentDraft.upsert).toHaveBeenCalled();
    expect(prisma.product.update).not.toHaveBeenCalled();
  });

  it('publishes draft only after approve', async () => {
    await service.approveDraft('p1');
    expect(prisma.product.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'p1' },
        data: expect.objectContaining({ description: 'New copy' }),
      }),
    );
    expect(prisma.productContentDraft.delete).toHaveBeenCalled();
  });

  it('rejects draft without updating product', async () => {
    await service.rejectDraft('p1');
    expect(prisma.product.update).not.toHaveBeenCalled();
    expect(prisma.productContentDraft.delete).toHaveBeenCalled();
  });
});
