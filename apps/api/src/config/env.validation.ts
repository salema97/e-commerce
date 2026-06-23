import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(3001),
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().min(1),
  CLERK_SECRET_KEY: z.string().min(1),
  CLERK_WEBHOOK_SECRET: z.string().min(1),
  STRIPE_SECRET_KEY: z.string().min(1),
  STRIPE_WEBHOOK_SECRET: z.string().min(1),
  STRIPE_SUCCESS_URL: z.string().min(1),
  STRIPE_CANCEL_URL: z.string().min(1),
  KUSHKI_PRIVATE_KEY: z.string().min(1),
  KUSHKI_WEBHOOK_SECRET: z.string().min(1),
  PAYPHONE_TOKEN: z.string().min(1),
  PAYPHONE_STORE_ID: z.string().min(1),
  MERCADOPAGO_ACCESS_TOKEN: z.string().min(1),
  MERCADOPAGO_WEBHOOK_SECRET: z.string().min(1),
  PLACETOPAY_LOGIN: z.string().min(1),
  PLACETOPAY_SECRET_KEY: z.string().min(1),
  PLACETOPAY_BASE_URL: z.string().min(1),
  DEFAULT_LOCAL_PAYMENT_PROVIDER: z.string().optional(),
  R2_ACCOUNT_ID: z.string().min(1),
  R2_ACCESS_KEY_ID: z.string().min(1),
  R2_SECRET_ACCESS_KEY: z.string().min(1),
  R2_BUCKET_NAME: z.string().min(1),
  R2_PUBLIC_URL: z.string().min(1),
  SRI_MODE: z.enum(['direct', 'intermediary']).default('direct'),
  SRI_RUC: z.string().min(1),
  SRI_SOL_KEY: z.string().min(1),
  SRI_DIGITAL_CERTIFICATE_PATH: z.string().min(1),
  SRI_DIGITAL_CERTIFICATE_PASSWORD: z.string().min(1),
  SRI_ESTABLISHMENT_CODE: z.string().min(1),
  SRI_EMISSION_POINT_CODE: z.string().min(1),
  SRI_TEST_ENVIRONMENT: z.enum(['true', 'false']).default('true'),
  SRI_COMPANY_NAME: z.string().min(1),
  SRI_COMPANY_TRADE_NAME: z.string().min(1),
  SRI_COMPANY_ADDRESS: z.string().min(1),
  SRI_COMPANY_CONTRIBUYENTE_ESPECIAL: z.string().optional(),
  SRI_COMPANY_OBLIGADO_CONTABILIDAD: z.string().min(1).default('SI'),
  SRI_QUEUE_ENABLED: z.enum(['true', 'false']).default('true'),
  SRI_WORKER_CONCURRENCY: z.coerce.number().int().positive().default(5),
  SRI_MAX_RETRIES: z.coerce.number().int().positive().default(5),
  SRI_RECONCILIATION_CRON: z.string().default('0 * * * *'),
  SRI_DELIVERY_ENABLED: z.enum(['true', 'false']).default('true'),
  SRI_EMAIL_FROM: z.string().min(1).default('facturas@example.com'),
  RETURN_WINDOW_DAYS: z.coerce.number().int().positive().default(30),
  EVOLUTION_API_URL: z.string().min(1),
  EVOLUTION_API_KEY: z.string().min(1),
  EVOLUTION_WEBHOOK_SECRET: z.string().min(1),
  EVOLUTION_INSTANCE_NAME: z.string().min(1),
  WHATSAPP_NOTIFICATIONS_ENABLED: z.enum(['true', 'false']).default('true'),
  EMAIL_PROVIDER: z.enum(['console', 'resend']).default('console'),
  RESEND_API_KEY: z.string().optional(),
  TRANSACTIONAL_EMAIL_FROM: z.string().optional(),
  EMAIL_NOTIFICATIONS_ENABLED: z.enum(['true', 'false']).default('true'),
  PUSH_PROVIDER: z.enum(['console', 'expo', 'onesignal']).default('console'),
  EXPO_ACCESS_TOKEN: z.string().optional(),
  ONESIGNAL_APP_ID: z.string().optional(),
  ONESIGNAL_API_KEY: z.string().optional(),
  PUSH_NOTIFICATIONS_ENABLED: z.enum(['true', 'false']).default('true'),
  MARKETING_EMAIL_PROVIDER: z.enum(['console', 'loops']).default('console'),
  LOOPS_API_KEY: z.string().optional(),
  STOREFRONT_URL: z.string().optional(),
  API_PUBLIC_URL: z.string().optional(),
  NOTIFICATION_UNSUBSCRIBE_SECRET: z.string().optional(),
  ABANDONED_CART_ENABLED: z.enum(['true', 'false']).default('true'),
  ABANDONED_CART_REMINDER_HOURS: z.coerce.number().int().positive().default(24),
  WIN_BACK_ENABLED: z.enum(['true', 'false']).default('true'),
  MEILI_HOST: z.string().optional(),
  MEILI_API_KEY: z.string().optional(),
  LLM_PROVIDER: z.enum(['console', 'openai', 'anthropic']).default('console'),
  OPENAI_API_KEY: z.string().optional(),
  ANTHROPIC_API_KEY: z.string().optional(),
  LLM_MODEL: z.string().default('gpt-4o'),
  ANTHROPIC_MODEL: z.string().default('claude-3-5-sonnet-20241022'),
  EMBEDDING_PROVIDER: z.enum(['console', 'openai']).default('console'),
  EMBEDDING_MODEL: z.string().default('text-embedding-3-small'),
  LLM_MAX_TOKENS: z.coerce.number().int().positive().default(2048),
  LLM_TIMEOUT_MS: z.coerce.number().int().positive().default(30000),
  SUPPORT_BOT_ENABLED: z.enum(['true', 'false']).default('false'),
  BOT_CONFIDENCE_THRESHOLD: z.coerce.number().min(0).max(1).default(0.7),
  SEMANTIC_SEARCH_ENABLED: z.enum(['true', 'false', 'auto']).default('auto'),
  CONVERSATION_ORCHESTRATOR: z.enum(['native', 'dify', 'typebot']).default('native'),
  KNOWLEDGE_INDEX_QUEUE_ENABLED: z.enum(['true', 'false']).default('true'),
  KNOWLEDGE_INDEX_QUEUE_CONCURRENCY: z.coerce.number().int().positive().default(3),
  KNOWLEDGE_USE_PGVECTOR: z.enum(['true', 'false']).default('true'),
  DIFY_API_URL: z.string().optional(),
  DIFY_API_KEY: z.string().optional(),
  TYPEBOT_API_URL: z.string().optional(),
  ENABLE_TEST_AUTH: z.enum(['true', 'false']).default('false'),
});

export type Env = z.infer<typeof envSchema>;

export function validate(config: Record<string, unknown>): Env {
  const result = envSchema.safeParse(config);

  if (!result.success) {
    const issues = result.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join('; ');
    throw new Error(`Environment validation failed: ${issues}`);
  }

  if (config.NODE_ENV === 'production' && config.ENABLE_TEST_AUTH === 'true') {
    throw new Error(
      'Environment validation failed: ENABLE_TEST_AUTH cannot be true in production',
    );
  }

  return result.data;
}
