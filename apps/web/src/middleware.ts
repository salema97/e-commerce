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

const REFRESH_TIMEOUT_MS = 5_000;

function isRole(value: string): value is Role {
  return ROLES.includes(value as Role);
}

function generateNonce(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return btoa(String.fromCharCode(...bytes));
}

function addSecurityHeaders(response: NextResponse, nonce: string): NextResponse {
  const csp = response.headers.get('Content-Security-Policy') ?? '';
  if (csp.includes('{NONCE}')) {
    response.headers.set(
      'Content-Security-Policy',
      csp.replaceAll("'nonce-{NONCE}'", `'nonce-${nonce}'`),
    );
  }

  response.headers.set('Cross-Origin-Opener-Policy', 'same-origin');
  response.headers.set('Cross-Origin-Resource-Policy', 'same-origin');
  response.headers.set('X-Permitted-Cross-Domain-Policies', 'none');
  return response;
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

async function tryRefreshSession(refreshToken: string) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REFRESH_TIMEOUT_MS);
    const tokens = await fetchAuthRefresh(refreshToken, controller.signal);
    clearTimeout(timeout);
    return tokens;
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
  const nonce = generateNonce();

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-nonce', nonce);
  const baseResponse = NextResponse.next({ request: { headers: requestHeaders } });

  if (!isAdmin && !isAccount) {
    return addSecurityHeaders(baseResponse, nonce);
  }

  let session = await readSession(request);
  let responseWithCookies: NextResponse | null = null;

  if (!session) {
    const refreshToken = request.cookies.get(REFRESH_TOKEN_COOKIE)?.value;
    if (refreshToken) {
      const tokens = await tryRefreshSession(refreshToken);
      if (tokens) {
        session = await readSession(request, tokens.accessToken);
        responseWithCookies = NextResponse.next({ request: { headers: requestHeaders } });
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

  return addSecurityHeaders(responseWithCookies ?? baseResponse, nonce);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};
