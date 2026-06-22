'use client';

import { useMemo } from 'react';
import { useAuth } from '@clerk/nextjs';
import { createApiClient } from '@repo/api-client';

function getBaseURL(): string {
  return (
    process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3001/v1'
  );
}

export function useApiClient() {
  const { getToken } = useAuth();

  return useMemo(
    () =>
      createApiClient({
        baseURL: getBaseURL(),
        getToken,
      }),
    [getToken],
  );
}
