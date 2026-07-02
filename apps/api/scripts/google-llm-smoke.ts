import { GoogleGenerativeAI } from '@google/generative-ai';
import { GoogleLlmProvider } from '../src/ai/llm/providers/google-llm.provider.js';
import { resolveLlmModel } from '../src/ai/llm/llm-config.js';
import type { ConfigService } from '@nestjs/config';

async function main(): Promise<void> {
  const apiKey = process.env.LLM_API_KEY;
  if (!apiKey) {
    throw new Error('LLM_API_KEY is not set');
  }

  const config = {
    get: (key: string, fallback?: string) => {
      const values: Record<string, string> = {
        LLM_API_KEY: apiKey,
        LLM_PROVIDER: 'google',
        LLM_MAX_TOKENS: '512',
        LLM_TIMEOUT_MS: '30000',
      };
      if (process.env.LLM_MODEL) {
        values.LLM_MODEL = process.env.LLM_MODEL;
      }
      return values[key] ?? fallback;
    },
  } as ConfigService;

  const modelName = resolveLlmModel(config);
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: modelName });

  const result = await model.generateContent('Responde solo: OK si funcionas');
  console.log('SDK MODEL:', modelName);
  console.log('SDK RESPONSE:', result.response.text());

  const provider = new GoogleLlmProvider(config);
  const completion = await provider.complete([
    {
      role: 'system',
      content: 'Eres un asistente de soporte de una tienda en línea en Ecuador. Responde en español.',
    },
    { role: 'user', content: '¿Cuál es el horario de atención?' },
  ]);

  console.log('PROVIDER CONFIDENCE:', completion.confidence);
  console.log('PROVIDER RESPONSE:', completion.text);
}

main().catch((error: unknown) => {
  console.error('ERROR:', error);
  process.exit(1);
});
