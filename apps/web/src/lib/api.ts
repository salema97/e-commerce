import { cookies } from 'next/headers';
import { createApiClient } from '@repo/api-client';
import { ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE } from './auth-cookies';
import { refreshServerAuthSession } from './auth-refresh';

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
    getToken: async () => token,
    onUnauthorized: async () => {
      const cookieStore = await cookies();
      const refreshToken = cookieStore.get(REFRESH_TOKEN_COOKIE)?.value;
      if (!refreshToken) {
        return false;
      }

      const newToken = await refreshServerAuthSession();
      if (!newToken) {
        return false;
      }

      token = newToken;
      return true;
    },
  });
}
