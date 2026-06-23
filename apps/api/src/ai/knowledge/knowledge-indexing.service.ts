import { Injectable, Logger } from '@nestjs/common';
import type { KnowledgeSourceType } from '@prisma/client';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service.js';
import { EmbeddingProvider } from '../embedding/embedding-provider.interface.js';
import { EMBEDDING_DIMENSIONS, formatPgVector } from '../embedding/embedding.constants.js';

@Injectable()
export class KnowledgeIndexingService {
  private readonly logger = new Logger(KnowledgeIndexingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly embeddingProvider: EmbeddingProvider,
    private readonly config: ConfigService,
  ) {}

  async deleteSource(sourceType: KnowledgeSourceType, sourceId: string): Promise<void> {
    await this.prisma.knowledgeChunk.deleteMany({ where: { sourceType, sourceId } });
  }

  async indexText(sourceType: KnowledgeSourceType, sourceId: string, content: string): Promise<void> {
    const chunks = chunkText(content);
    await this.prisma.knowledgeChunk.deleteMany({ where: { sourceType, sourceId } });

    for (const chunk of chunks) {
      const embedding = await this.embeddingProvider.embed(chunk);
      const record = await this.prisma.knowledgeChunk.create({
        data: {
          sourceType,
          sourceId,
          content: chunk,
          embedding,
        },
      });

      if (this.usePgVector && embedding.length === EMBEDDING_DIMENSIONS) {
        await this.persistPgVector(record.id, embedding);
      }
    }
  }

  async indexProduct(productId: string): Promise<void> {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      include: { attributes: true, category: true },
    });
    if (!product || product.status !== 'ACTIVE') {
      await this.deleteSource('PRODUCT', productId);
      return;
    }

    const attributeText = product.attributes.map((attr) => `${attr.name}: ${attr.value}`).join(', ');
    const content = [
      product.name,
      product.description ?? '',
      product.metaTitle ?? '',
      product.metaDescription ?? '',
      product.category?.name ?? '',
      attributeText,
    ]
      .filter(Boolean)
      .join('\n');

    await this.indexText('PRODUCT', productId, content);
  }

  async indexFaq(faqId: string): Promise<void> {
    const faq = await this.prisma.faq.findUnique({ where: { id: faqId } });
    if (!faq || !faq.isPublished) {
      await this.deleteSource('FAQ', faqId);
      return;
    }
    await this.indexText('FAQ', faqId, `${faq.question}\n${faq.answer}`);
  }

  async indexCmsPage(pageId: string): Promise<void> {
    const page = await this.prisma.cmsPage.findUnique({ where: { id: pageId } });
    if (!page || !page.isPublished) {
      await this.deleteSource('CMS_PAGE', pageId);
      return;
    }
    await this.indexText('CMS_PAGE', pageId, `${page.title}\n${page.bodyMarkdown}`);
  }

  private get usePgVector(): boolean {
    return this.config.get<string>('KNOWLEDGE_USE_PGVECTOR', 'true') === 'true';
  }

  private async persistPgVector(chunkId: string, embedding: number[]): Promise<void> {
    const vectorLiteral = formatPgVector(embedding);

    try {
      await this.prisma.$executeRawUnsafe(
        `UPDATE "KnowledgeChunk" SET "embeddingVector" = $1::vector WHERE id = $2`,
        vectorLiteral,
        chunkId,
      );
    } catch (error) {
      this.logger.warn({ error, chunkId }, 'Failed to persist pgvector embedding; JSON fallback remains');
    }
  }
}

function chunkText(text: string, maxLength = 800): string[] {
  const normalized = text.trim();
  if (!normalized) {
    return [];
  }
  if (normalized.length <= maxLength) {
    return [normalized];
  }

  const paragraphs = normalized.split(/\n{2,}/);
  const chunks: string[] = [];
  let current = '';

  for (const paragraph of paragraphs) {
    if (`${current}\n\n${paragraph}`.trim().length > maxLength && current) {
      chunks.push(current.trim());
      current = paragraph;
    } else {
      current = current ? `${current}\n\n${paragraph}` : paragraph;
    }
  }

  if (current.trim()) {
    chunks.push(current.trim());
  }

  return chunks;
}
