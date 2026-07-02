import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { LlmProvider } from '../llm-provider.interface.js';
import type { LlmCompletionOptions, LlmCompletionResult, LlmMessage } from '../llm.types.js';
import { requireLlmApiKey, resolveLlmModel } from '../llm-config.js';

@Injectable()
export class GoogleLlmProvider extends LlmProvider {
  private readonly logger = new Logger(GoogleLlmProvider.name);

  constructor(private readonly config: ConfigService) {
    super();
  }

  async complete(
    messages: LlmMessage[],
    options?: LlmCompletionOptions,
  ): Promise<LlmCompletionResult> {
    const apiKey = requireLlmApiKey(this.config, 'google');

    const modelName = resolveLlmModel(this.config);
    const maxTokens = options?.maxTokens ?? Number(this.config.get<string>('LLM_MAX_TOKENS') ?? '2048');
    const timeoutMs = Number(this.config.get<string>('LLM_TIMEOUT_MS') ?? '30000');

    const system = messages.find((message) => message.role === 'system')?.content;
    const userMessage =
      [...messages].reverse().find((message) => message.role === 'user')?.content ?? '';

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: modelName,
      systemInstruction: system,
      generationConfig: {
        maxOutputTokens: maxTokens,
        temperature: options?.temperature ?? 0.3,
      },
    });

    const completion = model.generateContent(userMessage);
    const timeout = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error(`Google LLM timed out after ${timeoutMs}ms`)), timeoutMs);
    });

    try {
      const result = await Promise.race([completion, timeout]);
      const text = result.response.text().trim();
      return { text, confidence: text.length > 20 ? 0.8 : 0.5 };
    } catch (error) {
      this.logger.error({ error }, 'Google LLM completion failed');
      throw error;
    }
  }
}
