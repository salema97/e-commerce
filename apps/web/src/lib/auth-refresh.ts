import { cookies } from 'next/headers';
import {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
  cookieOptions,
} from './auth-cookies';
import { fetchAuthRefresh } from './auth-proxy';

const REFRESH_MAX_AGE = 60 * 60 * 24 * 30;

let refreshInFlight: Promise<boolean> | null = null;
let serverRefreshInFlight: Promise<string | null> | null = null;

/** Client-side silent refresh via BFF — dedupes concurrent 401 retries. */
export function refreshAuthSession(): Promise<boolean> {
  if (typeof window === 'undefined') {
    return Promise.resolve(false);
  }

  if (!refreshInFlight) {
    refreshInFlight = fetch('/api/auth/refresh', {
      method: 'POST',
      credentials: 'same-origin',
    })
      .then((response) => response.ok)
      .catch(() => false)
      .finally(() => {
        refreshInFlight = null;
      });
  }

  return refreshInFlight;
}

/** Server-side token refresh for RSC/API fetches — dedupes concurrent 401 retries. */
export async function refreshServerAuthSession(): Promise<string | null> {
  if (!serverRefreshInFlight) {
    serverRefreshInFlight = (async () => {
      const cookieStore = await cookies();
      const refreshToken = cookieStore.get(REFRESH_TOKEN_COOKIE)?.value;
      if (!refreshToken) {
        return null;
      }

      const tokens = await fetchAuthRefresh(refreshToken);
      if (!tokens) {
        return null;
      }

      cookieStore.set(ACCESS_TOKEN_COOKIE, tokens.accessToken, {
        ...cookieOptions,
        maxAge: tokens.expiresIn,
      });
      cookieStore.set(REFRESH_TOKEN_COOKIE, tokens.refreshToken, {
        ...cookieOptions,
        maxAge: REFRESH_MAX_AGE,
      });

      return tokens.accessToken;
    })().finally(() => {
      serverRefreshInFlight = null;
    });
  }

  return serverRefreshInFlight;
}
