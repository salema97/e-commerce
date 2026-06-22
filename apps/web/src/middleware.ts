import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { getTestAuthSession, isTestAuthEnabled } from './lib/test-auth';

const isAdminRoute = createRouteMatcher(['/admin(.*)']);
const isSupportRoute = createRouteMatcher(['/admin/support(.*)']);

const ADMIN_ROLES = new Set(['SUPER_ADMIN', 'ADMIN']);
const SUPPORT_ROLES = new Set(['SUPER_ADMIN', 'ADMIN', 'SUPPORT']);

export default clerkMiddleware(async (auth, req) => {
  if (isAdminRoute(req)) {
    const { userId, sessionClaims } = await auth();
    const metadata = sessionClaims?.public_metadata as { role?: string } | undefined;
    const role = metadata?.role;

    const allowedRoles = isSupportRoute(req) ? SUPPORT_ROLES : ADMIN_ROLES;
    let isAuthenticatedAdmin = Boolean(userId && typeof role === 'string' && allowedRoles.has(role));

    if (!isAuthenticatedAdmin && isTestAuthEnabled()) {
      const testSession = await getTestAuthSession();
      if (testSession && allowedRoles.has(testSession.role)) {
        isAuthenticatedAdmin = true;
      }
    }

    if (!isAuthenticatedAdmin) {
      const signInUrl = new URL('/sign-in', req.url);
      signInUrl.searchParams.set('redirect_url', req.url);
      return NextResponse.redirect(signInUrl);
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
