import { createApiClient } from '@repo/api-client';

export function getServerApiClient() {
  const baseURL = process.env.API_BASE_URL ?? 'http://localhost:3001/v1';
  return createApiClient({ baseURL });
}
