import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import type { Role } from '@repo/shared-types';
import { ACCESS_TOKEN_COOKIE } from './auth-cookies';

export interface SessionUser {
  userId: string;
  role: Role;
}

export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ACCESS_TOKEN_COOKIE)?.value;
  if (!token) return null;

  const secret = process.env.AUTH_JWT_ACCESS_SECRET;
  if (!secret) return null;

  try {
    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(secret),
    );
    if (payload.type !== 'access' || typeof payload.sub !== 'string') {
      return null;
    }
    return {
      userId: payload.sub,
      role: payload.role as Role,
    };
  } catch {
    return null;
  }
}
