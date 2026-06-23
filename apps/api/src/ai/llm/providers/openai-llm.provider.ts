import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { LlmProvider } from '../llm-provider.interface.js';
import type { LlmCompletionOptions, LlmCompletionResult, LlmMessage } from '../llm.types.js';

@Injectable()
export class OpenAiLlmProvider extends LlmProvider {
  private readonly logger = new Logger(OpenAiLlmProvider.name);

  constructor(private readonly config: ConfigService) {
    super();
  }

  async complete(
    messages: LlmMessage[],
    options?: LlmCompletionOptions,
  ): Promise<LlmCompletionResult> {
    const apiKey = this.config.get<string>('OPENAI_API_KEY');
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY is required when LLM_PROVIDER=openai');
    }

    const client = new OpenAI({ apiKey });
    const model = this.config.get<string>('LLM_MODEL') ?? 'gpt-4o';
    const maxTokens = options?.maxTokens ?? Number(this.config.get<string>('LLM_MAX_TOKENS') ?? '2048');
    const timeoutMs = Number(this.config.get<string>('LLM_TIMEOUT_MS') ?? '30000');

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await client.chat.completions.create(
        {
          model,
          messages,
          max_tokens: maxTokens,
          temperature: options?.temperature ?? 0.3,
        },
        { signal: controller.signal },
      );

      const text = response.choices[0]?.message?.content?.trim() ?? '';
      const confidence = text.length > 20 ? 0.8 : 0.5;

      return { text, confidence };
    } catch (error) {
      this.logger.error({ error }, 'OpenAI completion failed');
      throw error;
    } finally {
      clearTimeout(timer);
    }
  }
}
