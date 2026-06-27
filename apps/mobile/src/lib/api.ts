import { useMemo } from 'react';
import {
  createApiClient,
  createQueryHooks,
  type ApiClient,
  type ApiQueryHooks,
} from '@repo/api-client';
import type { AuthTokens } from '@repo/shared-types';
import {
  clearAuthSession,
  getRefreshToken,
  getStoredUser,
  updateAuthTokens,
} from './auth-storage';
import { getApiBaseUrl } from './env';

let bridgeGetToken: () => Promise<string | null> = async () => null;
let pendingRefreshedToken: string | null = null;
let onTokenRefreshedRef: ((accessToken: string) => void) | undefined;
let onSessionExpiredRef: (() => void) | undefined;
let refreshInFlight: Promise<boolean> | null = null;

export function setGetAuthToken(getToken: () => Promise<string | null>): void {
  bridgeGetToken = getToken;
  pendingRefreshedToken = null;
}

export function setAuthRefreshCallbacks(callbacks: {
  onTokenRefreshed?: (accessToken: string) => void;
  onSessionExpired?: () => void;
}): void {
  onTokenRefreshedRef = callbacks.onTokenRefreshed;
  onSessionExpiredRef = callbacks.onSessionExpired;
}

async function getCurrentAccessToken(): Promise<string | null> {
  if (pendingRefreshedToken) {
    return pendingRefreshedToken;
  }
  return bridgeGetToken();
}

async function handleUnauthorized(): Promise<boolean> {
  if (!refreshInFlight) {
    refreshInFlight = performTokenRefresh().finally(() => {
      refreshInFlight = null;
    });
  }
  return refreshInFlight;
}

async function performTokenRefresh(): Promise<boolean> {
  const refreshToken = await getRefreshToken();
  if (!refreshToken) {
    await clearAuthSession();
    onSessionExpiredRef?.();
    return false;
  }

  const response = await fetch(`${getApiBaseUrl()}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });

  if (!response.ok) {
    await clearAuthSession();
    onSessionExpiredRef?.();
    return false;
  }

  const tokens = (await response.json()) as AuthTokens;
  const user = await getStoredUser();
  if (!user) {
    await clearAuthSession();
    onSessionExpiredRef?.();
    return false;
  }

  await updateAuthTokens(tokens.accessToken, tokens.refreshToken);
  pendingRefreshedToken = tokens.accessToken;
  onTokenRefreshedRef?.(tokens.accessToken);
  return true;
}

export function createMobileApiClient(): ApiClient {
  return createApiClient({
    baseURL: getApiBaseUrl(),
    getToken: getCurrentAccessToken,
    onUnauthorized: handleUnauthorized,
  });
}

export function useApiQueryHooks(): ApiQueryHooks {
  const baseURL = getApiBaseUrl();
  return useMemo(() => createQueryHooks(createMobileApiClient()), [baseURL]);
}
