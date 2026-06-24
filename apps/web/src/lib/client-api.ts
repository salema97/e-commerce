'use client';

import { useMemo } from 'react';
import { createApiClient, createQueryHooks } from '@repo/api-client';
import { useAuth } from '@/contexts/auth-context';

function getBaseURL(): string {
  return process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3001/v1';
}

export function useAuthApiReady(): boolean {
  const { accessToken, loading } = useAuth();
  return !loading && Boolean(accessToken);
}

export function useApiClient() {
  const { accessToken } = useAuth();

  return useMemo(
    () =>
      createApiClient({
        baseURL: getBaseURL(),
        getToken: () => accessToken,
        onError: (error) => {
          // eslint-disable-next-line no-console
          console.error('API error:', error.message);
        },
      }),
    [accessToken],
  );
}

export function useApiQueryHooks() {
  const client = useApiClient();
  return useMemo(() => createQueryHooks(client), [client]);
}
