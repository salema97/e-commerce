import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service.js';
import { EmbeddingProvider } from '../embedding/embedding-provider.interface.js';

export interface RetrievedChunk {
  id: string;
  content: string;
  score: number;
}

@Injectable()
export class RagService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly embeddingProvider: EmbeddingProvider,
  ) {}

  async retrieve(query: string, topK = 5): Promise<RetrievedChunk[]> {
    const queryVector = await this.embeddingProvider.embed(query);
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
