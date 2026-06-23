import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { LlmMessage } from './llm.types.js';

const INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?(previous|prior)\s+instructions/i,
  /system\s+prompt/i,
  /jailbreak/i,
  /act\s+as\s+(?:a\s+)?dan/i,
];

@Injectable()
export class LlmGuardrailsService {
  constructor(private readonly config: ConfigService) {}

  sanitizeMessages(messages: LlmMessage[]): LlmMessage[] {
    const maxTokens = Number(this.config.get<string>('LLM_MAX_TOKENS') ?? '2048');

    return messages.map((message) => ({
      ...message,
      content: this.redactPii(this.truncate(message.content, maxTokens * 4)),
    }));
  }

  detectPromptInjection(text: string): boolean {
    return INJECTION_PATTERNS.some((pattern) => pattern.test(text));
  }

  redactPii(text: string): string {
    return text
      .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[email]')
      .replace(/\b\d{10,13}\b/g, '[phone]')
      .replace(/\b\d{10}\b/g, '[cedula]');
  }

  private truncate(text: string, maxChars: number): string {
    if (text.length <= maxChars) {
      return text;
    }
    return `${text.slice(0, maxChars)}…`;
  }
}
