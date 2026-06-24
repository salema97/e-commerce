import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { EmbeddingProvider } from '../embedding-provider.interface.js';

@Injectable()
export class OpenAiEmbeddingProvider extends EmbeddingProvider {
  private readonly logger = new Logger(OpenAiEmbeddingProvider.name);

  constructor(private readonly config: ConfigService) {
    super();
  }

  async embed(text: string): Promise<number[]> {
    const apiKey = this.config.get<string>('OPENAI_API_KEY');
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY is required for OpenAI embeddings');
    }

    const client = new OpenAI({ apiKey });
    const model = this.config.get<string>('EMBEDDING_MODEL') ?? 'text-embedding-3-small';

    try {
      const response = await client.embeddings.create({ model, input: text });
      return response.data[0]?.embedding ?? [];
    } catch (error) {
      this.logger.error({ error }, 'OpenAI embedding failed');
      throw error;
    }
  }
}
