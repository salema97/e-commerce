import type { LlmCompletionOptions, LlmCompletionResult, LlmMessage } from './llm.types.js';

export abstract class LlmProvider {
  abstract complete(
    messages: LlmMessage[],
    options?: LlmCompletionOptions,
  ): Promise<LlmCompletionResult>;
}
