import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { EmbeddingProvider } from '../embedding-provider.interface.js';
import { getEmbeddingApiKey } from '../../llm/llm-config.js';

@Injectable()
export class OpenAiEmbeddingProvider extends EmbeddingProvider {
  private readonly logger = new Logger(OpenAiEmbeddingProvider.name);

  constructor(private readonly config: ConfigService) {
    super();
  }

  async embed(text: string): Promise<number[]> {
    const apiKey = getEmbeddingApiKey(this.config);
    if (!apiKey) {
      throw new Error('EMBEDDING_API_KEY or LLM_API_KEY is required when EMBEDDING_PROVIDER=openai');
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
