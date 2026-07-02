import { describe, expect, it } from 'vitest';
import {
  getLlmApiKey,
  getLlmProvider,
  resolveLlmModel,
} from './llm-config.js';

function mockConfig(values: Record<string, string>): { get: (key: string, fallback?: string) => string | undefined } {
  return {
    get: (key: string, fallback?: string) => values[key] ?? fallback,
  };
}

describe('llm-config', () => {
  it('resolves provider-specific default models', () => {
    expect(resolveLlmModel(mockConfig({ LLM_PROVIDER: 'google' }) as never)).toBe(
      'gemini-2.5-flash-lite',
    );
    expect(resolveLlmModel(mockConfig({ LLM_PROVIDER: 'openai' }) as never)).toBe('gpt-4o');
    expect(
      resolveLlmModel(mockConfig({ LLM_PROVIDER: 'google', LLM_MODEL: 'gemini-3.5-flash' }) as never),
    ).toBe('gemini-3.5-flash');
  });

  it('reads unified LLM_API_KEY', () => {
    expect(getLlmApiKey(mockConfig({ LLM_API_KEY: 'secret' }) as never)).toBe('secret');
    expect(getLlmProvider(mockConfig({ LLM_PROVIDER: 'anthropic' }) as never)).toBe('anthropic');
  });
});
