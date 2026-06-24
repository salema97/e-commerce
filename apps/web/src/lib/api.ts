import { cookies } from 'next/headers';
import { createApiClient } from '@repo/api-client';
import { ACCESS_TOKEN_COOKIE } from './auth-cookies';

export interface ServerApiClientOptions {
  token?: string | null;
}

export async function getServerApiClient(options?: ServerApiClientOptions) {
  const baseURL = process.env.API_BASE_URL ?? 'http://localhost:3001/v1';
  let token = options?.token ?? null;

  if (!token) {
    const cookieStore = await cookies();
    token = cookieStore.get(ACCESS_TOKEN_COOKIE)?.value ?? null;
  }

  return createApiClient({
    baseURL,
    getToken: token ? () => token : undefined,
  });
}
