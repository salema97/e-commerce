export interface LlmMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LlmCompletionOptions {
  maxTokens?: number;
  temperature?: number;
}

export interface LlmCompletionResult {
  text: string;
  confidence: number;
}
