import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { LlmCompletionOptions, LlmCompletionResult, LlmMessage } from './llm/llm.types.js';
import { LlmProvider } from './llm/llm-provider.interface.js';
import { ConsoleLlmProvider } from './llm/providers/console-llm.provider.js';
import { OpenAiLlmProvider } from './llm/providers/openai-llm.provider.js';
import { AnthropicLlmProvider } from './llm/providers/anthropic-llm.provider.js';
import { EmbeddingProvider } from './embedding/embedding-provider.interface.js';
import { ConsoleEmbeddingProvider } from './embedding/providers/console-embedding.provider.js';
import { OpenAiEmbeddingProvider } from './embedding/providers/openai-embedding.provider.js';

@Injectable()
export class ConfiguredLlmProvider extends LlmProvider {
  private readonly delegate: LlmProvider;

  constructor(
    config: ConfigService,
    consoleProvider: ConsoleLlmProvider,
    openAiProvider: OpenAiLlmProvider,
    anthropicProvider: AnthropicLlmProvider,
  ) {
    super();
    const selected = config.get<string>('LLM_PROVIDER', 'console');
    if (selected === 'openai') {
      this.delegate = openAiProvider;
    } else if (selected === 'anthropic') {
      this.delegate = anthropicProvider;
    } else {
      this.delegate = consoleProvider;
    }
  }

  complete(messages: LlmMessage[], options?: LlmCompletionOptions): Promise<LlmCompletionResult> {
    return this.delegate.complete(messages, options);
  }
}

@Injectable()
export class ConfiguredEmbeddingProvider extends EmbeddingProvider {
  private readonly delegate: EmbeddingProvider;

  constructor(
    config: ConfigService,
    consoleProvider: ConsoleEmbeddingProvider,
    openAiProvider: OpenAiEmbeddingProvider,
  ) {
    super();
    const selected = config.get<string>('EMBEDDING_PROVIDER', 'console');
    this.delegate = selected === 'openai' ? openAiProvider : consoleProvider;
  }

  embed(text: string): Promise<number[]> {
    return this.delegate.embed(text);
  }
}
