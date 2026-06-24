import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';
import type { Role } from '@repo/shared-types';
import { ACCESS_TOKEN_COOKIE } from '@/lib/auth-cookies';
import { canAccessAdminPath } from '@/lib/admin-nav';

const ROLES: Role[] = [
  'SUPER_ADMIN',
  'ADMIN',
  'FINANCE',
  'INVENTORY',
  'SUPPORT',
  'CUSTOMER',
];

function isRole(value: string): value is Role {
  return ROLES.includes(value as Role);
}

async function readSession(request: NextRequest) {
  const token = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value;
  const secret = process.env.AUTH_JWT_ACCESS_SECRET;
  if (!token || !secret) return null;

  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(secret));
    if (payload.type !== 'access' || typeof payload.sub !== 'string') return null;
    const role = String(payload.role);
    if (!isRole(role)) return null;
    return { userId: payload.sub, role };
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (!pathname.startsWith('/admin')) {
    return NextResponse.next();
  }

  const session = await readSession(request);

  if (!session || !canAccessAdminPath(session.role, pathname)) {
    const signInUrl = new URL('/sign-in', request.url);
    signInUrl.searchParams.set('redirect_url', pathname);
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
