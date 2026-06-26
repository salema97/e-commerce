import { NextResponse } from 'next/server';
import type { AuthResponse } from '@repo/shared-types';
import {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
  cookieOptions,
} from '@/lib/auth-cookies';

const API_BASE = process.env.API_BASE_URL ?? 'http://localhost:3001/v1';

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
  response.cookies.set(ACCESS_TOKEN_COOKIE, data.tokens.accessToken, {
    ...cookieOptions,
    maxAge: data.tokens.expiresIn,
  });
  response.cookies.set(REFRESH_TOKEN_COOKIE, data.tokens.refreshToken, {
    ...cookieOptions,
    maxAge: 60 * 60 * 24 * 30,
  });
  return response;
}
