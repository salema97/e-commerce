import { Injectable } from '@nestjs/common';
import { createHash } from 'node:crypto';
import { EmbeddingProvider } from '../embedding-provider.interface.js';

const DIMENSIONS = 64;

@Injectable()
export class ConsoleEmbeddingProvider extends EmbeddingProvider {
  async embed(text: string): Promise<number[]> {
    const hash = createHash('sha256').update(text).digest();
    const vector: number[] = [];
    for (let index = 0; index < DIMENSIONS; index += 1) {
      vector.push((hash[index % hash.length] ?? 0) / 255);
    }
    return vector;
  }
}
