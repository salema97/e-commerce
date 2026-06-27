import { NextRequest, NextResponse } from 'next/server';
import { REFRESH_TOKEN_COOKIE } from '@/lib/auth-cookies';
import { clearAuthCookies } from '@/lib/auth-proxy';

const API_BASE = process.env.API_BASE_URL ?? 'http://localhost:3001/v1';

export async function POST(request: NextRequest) {
  const refreshToken = request.cookies.get(REFRESH_TOKEN_COOKIE)?.value;
  if (refreshToken) {
    await fetch(`${API_BASE}/auth/logout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
  }

  const response = NextResponse.json({ ok: true });
  clearAuthCookies(response);
  return response;
}
