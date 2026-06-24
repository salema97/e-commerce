import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';
import { LlmProvider } from '../llm-provider.interface.js';
import type { LlmCompletionOptions, LlmCompletionResult, LlmMessage } from '../llm.types.js';

@Injectable()
export class AnthropicLlmProvider extends LlmProvider {
  private readonly logger = new Logger(AnthropicLlmProvider.name);

  constructor(private readonly config: ConfigService) {
    super();
  }

  async complete(
    messages: LlmMessage[],
    options?: LlmCompletionOptions,
  ): Promise<LlmCompletionResult> {
    const apiKey = this.config.get<string>('ANTHROPIC_API_KEY');
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY is required when LLM_PROVIDER=anthropic');
    }

    const client = new Anthropic({ apiKey });
    const model = this.config.get<string>('ANTHROPIC_MODEL') ?? 'claude-3-5-sonnet-20241022';
    const maxTokens = options?.maxTokens ?? Number(this.config.get<string>('LLM_MAX_TOKENS') ?? '2048');

    const system = messages.find((message) => message.role === 'system')?.content;
    const chatMessages = messages
      .filter((message) => message.role !== 'system')
      .map((message) => ({
        role: message.role === 'assistant' ? ('assistant' as const) : ('user' as const),
        content: message.content,
      }));

    try {
      const response = await client.messages.create({
        model,
        max_tokens: maxTokens,
        system,
        messages: chatMessages,
        temperature: options?.temperature ?? 0.3,
      });

      const textBlock = response.content.find((block) => block.type === 'text');
      const text = textBlock && 'text' in textBlock ? textBlock.text.trim() : '';
      return { text, confidence: text.length > 20 ? 0.8 : 0.5 };
    } catch (error) {
      this.logger.error({ error }, 'Anthropic completion failed');
      throw error;
    }
  }
}
