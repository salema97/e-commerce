import { auth } from '@clerk/nextjs/server';
import type { Role } from '@repo/shared-types';

export async function getCurrentRole(): Promise<Role | null> {
  const session = await auth();
  const metadata = session.sessionClaims?.public_metadata as
    | { role?: Role }
    | undefined;
  return metadata?.role ?? null;
}

export function hasRole(role: Role | null, allowed: Role[]): boolean {
  if (!role) return false;
  return allowed.includes(role);
}

export const adminRoles: Role[] = ['SUPER_ADMIN', 'ADMIN'];
export const financeRoles: Role[] = ['SUPER_ADMIN', 'ADMIN', 'FINANCE'];
export const inventoryRoles: Role[] = ['SUPER_ADMIN', 'ADMIN', 'INVENTORY'];
export const supportRoles: Role[] = ['SUPER_ADMIN', 'ADMIN', 'SUPPORT'];
