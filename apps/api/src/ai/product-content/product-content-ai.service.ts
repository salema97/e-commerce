import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { LlmProvider } from '../llm/llm-provider.interface.js';
import { LlmGuardrailsService } from '../llm/llm-guardrails.service.js';

@Injectable()
export class ProductContentAiService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly llmProvider: LlmProvider,
    private readonly guardrails: LlmGuardrailsService,
  ) {}

  async generateDraft(productId: string) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      include: { attributes: true, images: true, category: true },
    });

    if (!product) {
      throw new NotFoundException(`Product ${productId} not found`);
    }

    const attributeText = product.attributes.map((attr) => `${attr.name}: ${attr.value}`).join(', ');
    const prompt = [
      'Genera contenido de e-commerce en español para Ecuador.',
      'Devuelve SOLO JSON con keys: description, metaTitle, metaDescription, imageAlts (array de strings).',
      `Producto: ${product.name}`,
      `Categoría: ${product.category?.name ?? 'General'}`,
      `Atributos: ${attributeText}`,
      `Descripción actual: ${product.description ?? ''}`,
      `Imágenes: ${product.images.length}`,
    ].join('\n');

    const messages = this.guardrails.sanitizeMessages([
      { role: 'system', content: 'Eres un copywriter de e-commerce. Responde solo JSON válido.' },
      { role: 'user', content: prompt },
    ]);

    const completion = await this.llmProvider.complete(messages, { temperature: 0.4 });
    const parsed = parseDraftJson(completion.text);

    return this.prisma.productContentDraft.upsert({
      where: { productId },
      create: {
        productId,
        description: parsed.description,
        metaTitle: parsed.metaTitle,
        metaDescription: parsed.metaDescription,
        imageAlts: parsed.imageAlts,
      },
      update: {
        description: parsed.description,
        metaTitle: parsed.metaTitle,
        metaDescription: parsed.metaDescription,
        imageAlts: parsed.imageAlts,
      },
    });
  }

  async approveDraft(productId: string) {
    const draft = await this.prisma.productContentDraft.findUnique({ where: { productId } });
    if (!draft) {
      throw new NotFoundException('No content draft for product');
    }

    await this.prisma.product.update({
      where: { id: productId },
      data: {
        description: draft.description ?? undefined,
        metaTitle: draft.metaTitle ?? undefined,
        metaDescription: draft.metaDescription ?? undefined,
      },
    });

    const imageAlts = Array.isArray(draft.imageAlts) ? (draft.imageAlts as string[]) : [];
    if (imageAlts.length > 0) {
      const images = await this.prisma.productImage.findMany({
        where: { productId },
        orderBy: { sortOrder: 'asc' },
      });
      await Promise.all(
        images.map((image, index) =>
          this.prisma.productImage.update({
            where: { id: image.id },
            data: { alt: imageAlts[index] ?? image.alt },
          }),
        ),
      );
    }

    await this.prisma.productContentDraft.delete({ where: { productId } });
    return this.prisma.product.findUnique({ where: { id: productId } });
  }

  async rejectDraft(productId: string) {
    const draft = await this.prisma.productContentDraft.findUnique({ where: { productId } });
    if (!draft) {
      throw new NotFoundException('No content draft for product');
    }
    await this.prisma.productContentDraft.delete({ where: { productId } });
    return { success: true };
  }

  getDraft(productId: string) {
    return this.prisma.productContentDraft.findUnique({ where: { productId } });
  }
}

function parseDraftJson(text: string): {
  description?: string;
  metaTitle?: string;
  metaDescription?: string;
  imageAlts?: string[];
} {
  try {
    const jsonStart = text.indexOf('{');
    const jsonEnd = text.lastIndexOf('}');
    if (jsonStart === -1 || jsonEnd === -1) {
      return { description: text.trim() };
    }
    return JSON.parse(text.slice(jsonStart, jsonEnd + 1)) as {
      description?: string;
      metaTitle?: string;
      metaDescription?: string;
      imageAlts?: string[];
    };
  } catch {
    return { description: text.trim() };
  }
}
