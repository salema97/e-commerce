import { createApiClient } from '@repo/api-client';

export interface ServerApiClientOptions {
  token?: string | null;
}

export function getServerApiClient(options?: ServerApiClientOptions) {
  const baseURL = process.env.API_BASE_URL ?? 'http://localhost:3001/v1';
  return createApiClient({
    baseURL,
    getToken: options?.token ? () => options.token ?? null : undefined,
  });
}
