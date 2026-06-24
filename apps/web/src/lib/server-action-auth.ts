import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import type { Role } from '@repo/shared-types';
import { ACCESS_TOKEN_COOKIE } from './auth-cookies';
import { getSession } from './session';

export async function requireServerSession(redirectUrl = '/sign-in'): Promise<{
  userId: string;
  role: Role;
}> {
  const session = await getSession();
  if (!session) {
    redirect(redirectUrl);
  }
  return session;
}

export async function requireServerRoles(
  allowed: Role[],
  redirectUrl: string,
): Promise<{ userId: string; role: Role }> {
  const session = await requireServerSession(redirectUrl);
  if (!allowed.includes(session.role)) {
    redirect(redirectUrl);
  }
  return session;
}

export async function requireServerAuthToken(): Promise<string> {
  const session = await getSession();
  if (!session) {
    throw new Error('No autorizado');
  }
  const cookieStore = await cookies();
  const token = cookieStore.get(ACCESS_TOKEN_COOKIE)?.value;
  if (!token) {
    throw new Error('No autorizado');
  }
  return token;
}
