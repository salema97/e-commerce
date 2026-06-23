import { Injectable } from '@nestjs/common';
import type { KnowledgeSourceType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service.js';
import { EmbeddingProvider } from '../embedding/embedding-provider.interface.js';

@Injectable()
export class KnowledgeIndexingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly embeddingProvider: EmbeddingProvider,
  ) {}

  async indexText(sourceType: KnowledgeSourceType, sourceId: string, content: string): Promise<void> {
    const chunks = chunkText(content);
    await this.prisma.knowledgeChunk.deleteMany({ where: { sourceType, sourceId } });

    for (const chunk of chunks) {
      const embedding = await this.embeddingProvider.embed(chunk);
      await this.prisma.knowledgeChunk.create({
        data: {
          sourceType,
          sourceId,
          content: chunk,
          embedding,
        },
      });
    }
  }

  async indexProduct(productId: string): Promise<void> {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      include: { attributes: true, category: true },
    });
    if (!product || product.status !== 'ACTIVE') {
      await this.prisma.knowledgeChunk.deleteMany({
        where: { sourceType: 'PRODUCT', sourceId: productId },
      });
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
      await this.prisma.knowledgeChunk.deleteMany({ where: { sourceType: 'FAQ', sourceId: faqId } });
      return;
    }
    await this.indexText('FAQ', faqId, `${faq.question}\n${faq.answer}`);
  }

  async indexCmsPage(pageId: string): Promise<void> {
    const page = await this.prisma.cmsPage.findUnique({ where: { id: pageId } });
    if (!page || !page.isPublished) {
      await this.prisma.knowledgeChunk.deleteMany({ where: { sourceType: 'CMS_PAGE', sourceId: pageId } });
      return;
    }
    await this.indexText('CMS_PAGE', pageId, `${page.title}\n${page.bodyMarkdown}`);
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
