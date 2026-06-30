import { NextResponse } from 'next/server';
import type { AuthResponse, AuthTokens } from '@repo/shared-types';
import {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
  cookieOptions,
} from '@/lib/auth-cookies';

const API_BASE = process.env.API_BASE_URL ?? 'http://localhost:3001/v1';
const REFRESH_MAX_AGE = 60 * 60 * 24 * 30;

export function setAuthCookies(response: NextResponse, tokens: AuthTokens): void {
  response.cookies.set(ACCESS_TOKEN_COOKIE, tokens.accessToken, {
    ...cookieOptions,
    maxAge: tokens.expiresIn,
  });
  response.cookies.set(REFRESH_TOKEN_COOKIE, tokens.refreshToken, {
    ...cookieOptions,
    maxAge: REFRESH_MAX_AGE,
  });
}

export function clearAuthCookies(response: NextResponse): void {
  response.cookies.set(ACCESS_TOKEN_COOKIE, '', { ...cookieOptions, maxAge: 0 });
  response.cookies.set(REFRESH_TOKEN_COOKIE, '', { ...cookieOptions, maxAge: 0 });
}

export async function fetchAuthRefresh(
  refreshToken: string,
  signal?: AbortSignal,
): Promise<AuthTokens | null> {
  const upstream = await fetch(`${API_BASE}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
    cache: 'no-store',
    signal,
  });

  if (!upstream.ok) {
    return null;
  }

  return upstream.json() as Promise<AuthTokens>;
}

export async function proxyAuth(
  path: 'login' | 'register',
  body: unknown,
): Promise<NextResponse> {
  const upstream = await fetch(`${API_BASE}/auth/${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const payload = (await upstream.json()) as AuthResponse | { message?: string };
  if (!upstream.ok) {
    return NextResponse.json(payload, { status: upstream.status });
  }

  const data = payload as AuthResponse;
  const response = NextResponse.json({ user: data.user });
  setAuthCookies(response, data.tokens);
  return response;
}

export async function proxyRefresh(refreshToken: string): Promise<NextResponse> {
  const tokens = await fetchAuthRefresh(refreshToken);
  if (!tokens) {
    const response = NextResponse.json({ message: 'Invalid refresh token' }, { status: 401 });
    clearAuthCookies(response);
    return response;
  }

  const response = NextResponse.json({ ok: true });
  setAuthCookies(response, tokens);
  return response;
}
