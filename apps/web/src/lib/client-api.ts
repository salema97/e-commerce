'use client';

import { useMemo } from 'react';
import { createApiClient, createQueryHooks } from '@repo/api-client';
import { useAuth } from '@/contexts/auth-context';

function getBaseURL(): string {
  if (typeof window !== 'undefined') {
    return '/api/v1';
  }
  return process.env.API_BASE_URL ?? 'http://localhost:3001/v1';
}

export function useAuthApiReady(): boolean {
  const { isAuthenticated, loading } = useAuth();
  return !loading && isAuthenticated;
}

export function useApiClient() {
  return useMemo(
    () =>
      createApiClient({
        baseURL: getBaseURL(),
        onError: (error) => {
          // eslint-disable-next-line no-console
          console.error('API error:', error.message);
        },
      }),
    [],
  );
}

export function useApiQueryHooks() {
  const client = useApiClient();
  return useMemo(() => createQueryHooks(client), [client]);
}
