import type { Role } from '@repo/shared-types';
import { getSession } from './session';

export async function getCurrentRole(): Promise<Role | null> {
  const session = await getSession();
  return session?.role ?? null;
}

export async function getCurrentUser(): Promise<{ userId: string; role: Role } | null> {
  return getSession();
}

export function hasRole(role: Role | null, allowed: Role[]): boolean {
  if (!role) return false;
  return allowed.includes(role);
}

export const adminRoles: Role[] = ['SUPER_ADMIN', 'ADMIN'];
export const financeRoles: Role[] = ['SUPER_ADMIN', 'ADMIN', 'FINANCE'];
export const inventoryRoles: Role[] = ['SUPER_ADMIN', 'ADMIN', 'INVENTORY'];
export const supportRoles: Role[] = ['SUPER_ADMIN', 'ADMIN', 'SUPPORT'];
export const adminOrSupportRoles: Role[] = [
  'SUPER_ADMIN',
  'ADMIN',
  'SUPPORT',
  'FINANCE',
  'INVENTORY',
];
