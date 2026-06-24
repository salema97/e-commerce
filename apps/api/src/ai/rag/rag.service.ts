import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service.js';
import { EmbeddingProvider } from '../embedding/embedding-provider.interface.js';
import { formatPgVector } from '../embedding/embedding.constants.js';

export interface RetrievedChunk {
  id: string;
  content: string;
  score: number;
}

@Injectable()
export class RagService {
  private readonly logger = new Logger(RagService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly embeddingProvider: EmbeddingProvider,
    private readonly config: ConfigService,
  ) {}

  async retrieve(query: string, topK = 5): Promise<RetrievedChunk[]> {
    const queryVector = await this.embeddingProvider.embed(query);

    if (this.config.get<string>('KNOWLEDGE_USE_PGVECTOR', 'true') === 'true') {
      const pgResults = await this.retrieveWithPgVector(queryVector, topK);
      if (pgResults.length > 0) {
        return pgResults;
      }
    }

    return this.retrieveWithJsonCosine(queryVector, topK);
  }

  private async retrieveWithPgVector(queryVector: number[], topK: number): Promise<RetrievedChunk[]> {
    const vectorLiteral = formatPgVector(queryVector);

    try {
      const rows = await this.prisma.$queryRawUnsafe<
        Array<{ id: string; content: string; score: number }>
      >(
        `SELECT id, content, 1 - ("embeddingVector" <=> $1::vector) AS score
         FROM "KnowledgeChunk"
         WHERE "embeddingVector" IS NOT NULL
         ORDER BY "embeddingVector" <=> $1::vector
         LIMIT $2`,
        vectorLiteral,
        topK,
      );

      return rows.map((row) => ({
        id: row.id,
        content: row.content,
        score: Number(row.score),
      }));
    } catch (error) {
      this.logger.debug({ error }, 'pgvector retrieval unavailable; falling back to JSON cosine');
      return [];
    }
  }

  private async retrieveWithJsonCosine(queryVector: number[], topK: number): Promise<RetrievedChunk[]> {
    const chunks = await this.prisma.knowledgeChunk.findMany({
      where: { embedding: { not: Prisma.DbNull } },
      take: 500,
    });

    const scored = chunks
      .map((chunk) => {
        const vector = chunk.embedding as number[] | null;
        if (!vector || vector.length === 0) {
          return null;
        }
        return {
          id: chunk.id,
          content: chunk.content,
          score: cosineSimilarity(queryVector, vector),
        };
      })
      .filter((item): item is RetrievedChunk => item !== null)
      .sort((left, right) => right.score - left.score)
      .slice(0, topK);

    return scored;
  }
}

function cosineSimilarity(left: number[], right: number[]): number {
  const length = Math.min(left.length, right.length);
  let dot = 0;
  let leftNorm = 0;
  let rightNorm = 0;

  for (let index = 0; index < length; index += 1) {
    const leftValue = left[index] ?? 0;
    const rightValue = right[index] ?? 0;
    dot += leftValue * rightValue;
    leftNorm += leftValue * leftValue;
    rightNorm += rightValue * rightValue;
  }

  if (leftNorm === 0 || rightNorm === 0) {
    return 0;
  }

  return dot / (Math.sqrt(leftNorm) * Math.sqrt(rightNorm));
}
