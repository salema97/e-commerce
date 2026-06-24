import { JwtService } from '@nestjs/jwt';

export const TEST_JWT_SECRET = 'test-jwt-secret-minimum-32-characters!!';

export const BASE_TEST_CONFIG = {
  NODE_ENV: 'test',
  PORT: 3001,
  DATABASE_URL: 'postgresql://localhost:5432/test',
  REDIS_URL: 'redis://localhost:6379',
  AUTH_JWT_ACCESS_SECRET: TEST_JWT_SECRET,
  AUTH_ACCESS_TOKEN_TTL: '15m',
  AUTH_REFRESH_TOKEN_DAYS: '30',
  STRIPE_SECRET_KEY: 'sk_test_xxx',
  STRIPE_WEBHOOK_SECRET: 'whsec_xxx',
  KUSHKI_PRIVATE_KEY: 'kushki_private_test',
  KUSHKI_WEBHOOK_SECRET: 'kushki_webhook_secret',
  PAYPHONE_TOKEN: 'payphone_token_test',
  PAYPHONE_STORE_ID: 'payphone_store_test',
  MERCADOPAGO_ACCESS_TOKEN: 'mp_token_test',
  MERCADOPAGO_WEBHOOK_SECRET: 'mp_webhook_secret',
  PLACETOPAY_LOGIN: 'ptp_login_test',
  PLACETOPAY_SECRET_KEY: 'ptp_secret_test',
  PLACETOPAY_BASE_URL: 'https://ptp.test',
  SRI_MODE: 'direct',
  SRI_RUC: '1792146739001',
  SRI_SOL_KEY: 'test',
  SRI_DIGITAL_CERTIFICATE_PATH: 'data:test',
  SRI_DIGITAL_CERTIFICATE_PASSWORD: 'test',
  SRI_ESTABLISHMENT_CODE: '001',
  SRI_EMISSION_POINT_CODE: '001',
  SRI_TEST_ENVIRONMENT: 'true',
  SRI_QUEUE_ENABLED: 'false',
} as const;

const jwtService = new JwtService({ secret: TEST_JWT_SECRET });

export function signTestAccessToken(userId: string, role: string): string {
  return jwtService.sign({ sub: userId, role, type: 'access' });
}

export function bearerAuth(userId: string, role: string): { Authorization: string } {
  return { Authorization: `Bearer ${signTestAccessToken(userId, role)}` };
}
