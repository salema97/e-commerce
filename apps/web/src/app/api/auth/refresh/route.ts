import { NextRequest, NextResponse } from 'next/server';
import { REFRESH_TOKEN_COOKIE } from '@/lib/auth-cookies';
import { proxyRefresh } from '@/lib/auth-proxy';

export async function POST(request: NextRequest) {
  const refreshToken = request.cookies.get(REFRESH_TOKEN_COOKIE)?.value;
  if (!refreshToken) {
    return NextResponse.json({ message: 'Missing refresh token' }, { status: 401 });
  }

  return proxyRefresh(refreshToken);
}
