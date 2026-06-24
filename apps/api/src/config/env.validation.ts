import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(3001),
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().min(1),
  AUTH_JWT_ACCESS_SECRET: z.string().min(32),
  AUTH_ACCESS_TOKEN_TTL: z.string().default('15m'),
  AUTH_REFRESH_TOKEN_DAYS: z.coerce.number().int().positive().default(30),
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
});

export type Env = z.infer<typeof envSchema>;

export function validate(config: Record<string, unknown>): Env {
  const result = envSchema.safeParse(config);

  if (!result.success) {
    const issues = result.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join('; ');
    throw new Error(`Environment validation failed: ${issues}`);
  }

  return result.data;
}
