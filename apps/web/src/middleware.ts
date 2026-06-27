import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';
import type { Role } from '@repo/shared-types';
import { ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE } from '@/lib/auth-cookies';
import { fetchAuthRefresh, setAuthCookies } from '@/lib/auth-proxy';
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

async function readSession(request: NextRequest, accessToken?: string) {
  const token = accessToken ?? request.cookies.get(ACCESS_TOKEN_COOKIE)?.value;
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

function redirectToSignIn(request: NextRequest, pathname: string) {
  const signInUrl = new URL('/sign-in', request.url);
  signInUrl.searchParams.set('redirect_url', pathname);
  return NextResponse.redirect(signInUrl);
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isAdmin = pathname.startsWith('/admin');
  const isAccount = pathname.startsWith('/account');
  if (!isAdmin && !isAccount) {
    return NextResponse.next();
  }

  let session = await readSession(request);
  let responseWithCookies: NextResponse | null = null;

  if (!session) {
    const refreshToken = request.cookies.get(REFRESH_TOKEN_COOKIE)?.value;
    if (refreshToken) {
      const tokens = await fetchAuthRefresh(refreshToken);
      if (tokens) {
        session = await readSession(request, tokens.accessToken);
        responseWithCookies = NextResponse.next();
        setAuthCookies(responseWithCookies, tokens);
      }
    }
  }

  if (isAdmin) {
    if (!session || !canAccessAdminPath(session.role, pathname)) {
      return redirectToSignIn(request, pathname);
    }
  }

  if (isAccount && !session) {
    return redirectToSignIn(request, pathname);
  }

  return responseWithCookies ?? NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/account/:path*'],
};
