import { NextResponse } from 'next/server';
import { encodeTestAuthSession, isTestAuthEnabled, COOKIE_NAME } from '@/lib/test-auth';
import type { Role } from '@repo/shared-types';

export async function POST(request: Request) {
  if (!isTestAuthEnabled()) {
    return NextResponse.json({ error: 'Test auth is disabled' }, { status: 403 });
  }

  const body = (await request.json()) as { userId?: string; role?: Role };
  const userId = body.userId;
  const role = body.role;

  if (!userId || !role) {
    return NextResponse.json({ error: 'userId and role are required' }, { status: 400 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set({
    name: COOKIE_NAME,
    value: encodeTestAuthSession({ userId, role }),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  });

  return response;
}

export async function DELETE() {
  if (!isTestAuthEnabled()) {
    return NextResponse.json({ error: 'Test auth is disabled' }, { status: 403 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set({
    name: COOKIE_NAME,
    value: '',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });

  return response;
}
