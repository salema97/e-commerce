import { useMemo } from 'react';
import {
  createApiClient,
  createQueryHooks,
  type ApiClient,
  type ApiQueryHooks,
} from '@repo/api-client';
import { getApiBaseUrl } from './env';

let getAuthTokenRef: () => Promise<string | null> = async () => null;

export function setGetAuthToken(getToken: () => Promise<string | null>): void {
  getAuthTokenRef = getToken;
}

export function createMobileApiClient(): ApiClient {
  return createApiClient({
    baseURL: getApiBaseUrl(),
    getToken: () => getAuthTokenRef(),
  });
}

export function useApiQueryHooks(): ApiQueryHooks {
  const baseURL = getApiBaseUrl();
  return useMemo(() => createQueryHooks(createMobileApiClient()), [baseURL]);
}
