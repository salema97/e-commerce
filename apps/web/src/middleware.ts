import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';
import { ACCESS_TOKEN_COOKIE } from '@/lib/auth-cookies';

const ADMIN_ROLES = new Set(['SUPER_ADMIN', 'ADMIN', 'FINANCE', 'INVENTORY']);
const SUPPORT_ROLES = new Set(['SUPER_ADMIN', 'ADMIN', 'SUPPORT']);

async function readSession(request: NextRequest) {
  const token = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value;
  const secret = process.env.AUTH_JWT_ACCESS_SECRET;
  if (!token || !secret) return null;

  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(secret));
    if (payload.type !== 'access' || typeof payload.sub !== 'string') return null;
    return { userId: payload.sub, role: String(payload.role) };
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
  const isSupportRoute = pathname.startsWith('/admin/support');
  const allowedRoles = isSupportRoute ? SUPPORT_ROLES : ADMIN_ROLES;

  if (!session || !allowedRoles.has(session.role)) {
    const signInUrl = new URL('/sign-in', request.url);
    signInUrl.searchParams.set('redirect_url', pathname);
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
