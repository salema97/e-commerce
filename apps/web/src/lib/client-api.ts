'use client';

import { useMemo } from 'react';
import { useAuth } from '@clerk/nextjs';
import { createApiClient, createQueryHooks } from '@repo/api-client';

function getBaseURL(): string {
  return (
    process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3001/v1'
  );
}

function getTestAuthHeader(): Record<string, string> {
  if (typeof document === 'undefined') return {};
  if (process.env.NEXT_PUBLIC_ENABLE_TEST_AUTH !== 'true') return {};

  const match = document.cookie.match(/(?:^|; )__test_auth=([^;]*)/);
  if (!match) return {};

  return { 'X-Test-Auth': decodeURIComponent(match[1]) };
}

export function useApiClient() {
  const { getToken } = useAuth();

  return useMemo(
    () =>
      createApiClient({
        baseURL: getBaseURL(),
        getToken,
        onError: (error) => {
          // eslint-disable-next-line no-console
          console.error('API error:', error.message);
        },
        getHeaders: () => getTestAuthHeader(),
      }),
    [getToken],
  );
}

export function useApiQueryHooks() {
  const client = useApiClient();
  return useMemo(() => createQueryHooks(client), [client]);
}
