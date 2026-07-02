import type { ConfigService } from '@nestjs/config';

export type LlmProviderName = 'console' | 'openai' | 'anthropic' | 'google';

/** Default model per LLM_PROVIDER when LLM_MODEL is unset. */
export const LLM_PROVIDER_DEFAULT_MODELS: Record<LlmProviderName, string> = {
  console: 'console',
  openai: 'gpt-4o',
  anthropic: 'claude-3-5-sonnet-20241022',
  // Google AI free tier (2026): Flash-Lite = highest quotas; Flash / 3.x = more capable
  google: 'gemini-2.5-flash-lite',
};

/** Documented Google Gemini models with a meaningful free tier (text/chat). */
export const GOOGLE_FREE_TIER_MODELS = [
  'gemini-2.5-flash-lite',
  'gemini-2.5-flash',
  'gemini-3.1-flash-lite',
  'gemini-3.5-flash',
] as const;

export function getLlmProvider(config: ConfigService): LlmProviderName {
  const provider = config.get<string>('LLM_PROVIDER', 'console');
  if (provider === 'openai' || provider === 'anthropic' || provider === 'google') {
    return provider;
  }
  return 'console';
}

export function getLlmApiKey(config: ConfigService): string | undefined {
  return config.get<string>('LLM_API_KEY');
}

export function requireLlmApiKey(config: ConfigService, provider: LlmProviderName): string {
  const apiKey = getLlmApiKey(config);
  if (!apiKey) {
    throw new Error(`LLM_API_KEY is required when LLM_PROVIDER=${provider}`);
  }
  return apiKey;
}

export function resolveLlmModel(config: ConfigService): string {
  const configured = config.get<string>('LLM_MODEL');
  if (configured) {
    return configured;
  }
  return LLM_PROVIDER_DEFAULT_MODELS[getLlmProvider(config)];
}

export function getEmbeddingApiKey(config: ConfigService): string | undefined {
  return config.get<string>('EMBEDDING_API_KEY') ?? getLlmApiKey(config);
}
