import type { Role } from '@repo/shared-types';

export interface AdminNavItem {
  href: string;
  label: string;
  roles: Role[];
  group: 'catalog' | 'sales' | 'support' | 'finance' | 'knowledge';
}

export const adminNavItems: AdminNavItem[] = [
  { href: '/admin/dashboard', label: 'Panel', roles: ['SUPER_ADMIN', 'ADMIN'], group: 'catalog' },
  { href: '/admin/products', label: 'Productos', roles: ['SUPER_ADMIN', 'ADMIN'], group: 'catalog' },
  { href: '/admin/categories', label: 'Categorías', roles: ['SUPER_ADMIN', 'ADMIN'], group: 'catalog' },
  { href: '/admin/inventory', label: 'Inventario', roles: ['SUPER_ADMIN', 'ADMIN', 'INVENTORY'], group: 'catalog' },
  { href: '/admin/orders', label: 'Pedidos', roles: ['SUPER_ADMIN', 'ADMIN'], group: 'sales' },
  { href: '/admin/returns', label: 'Devoluciones', roles: ['SUPER_ADMIN', 'ADMIN'], group: 'sales' },
  { href: '/admin/customers', label: 'Clientes', roles: ['SUPER_ADMIN', 'ADMIN'], group: 'sales' },
  { href: '/admin/marketing', label: 'Marketing', roles: ['SUPER_ADMIN', 'ADMIN'], group: 'sales' },
  { href: '/admin/analytics', label: 'Analítica', roles: ['SUPER_ADMIN', 'ADMIN', 'FINANCE'], group: 'sales' },
  { href: '/admin/support', label: 'Soporte', roles: ['SUPER_ADMIN', 'ADMIN', 'SUPPORT'], group: 'support' },
  { href: '/admin/knowledge', label: 'Conocimiento', roles: ['SUPER_ADMIN', 'ADMIN', 'SUPPORT'], group: 'knowledge' },
  { href: '/admin/invoices', label: 'Facturación', roles: ['SUPER_ADMIN', 'ADMIN', 'FINANCE'], group: 'finance' },
  { href: '/admin/finance', label: 'Finanzas', roles: ['SUPER_ADMIN', 'ADMIN', 'FINANCE'], group: 'finance' },
];

export function filterAdminNav(role: Role): AdminNavItem[] {
  return adminNavItems.filter((item) => item.roles.includes(role));
}

/** RBAC compartido con middleware.ts — misma matriz que admin-nav.ts */
export function canAccessAdminPath(role: Role, pathname: string): boolean {
  const normalized = pathname.replace(/\/$/, '') || '/admin';

  if (normalized === '/admin') {
    return filterAdminNav(role).length > 0;
  }

  const match = [...adminNavItems]
    .filter((item) => normalized === item.href || normalized.startsWith(`${item.href}/`))
    .sort((left, right) => right.href.length - left.href.length)[0];

  if (!match) {
    return role === 'SUPER_ADMIN' || role === 'ADMIN';
  }

  return match.roles.includes(role);
}

export function adminNavLabelForPath(pathname: string): string {
  const match = adminNavItems.find(
    (item) => pathname === item.href || pathname.startsWith(`${item.href}/`),
  );
  return match?.label ?? 'Administración';
}

const staffPanelHomeByRole: Partial<Record<Role, string>> = {
  SUPER_ADMIN: '/admin/dashboard',
  ADMIN: '/admin/dashboard',
  FINANCE: '/admin/finance',
  INVENTORY: '/admin/inventory',
  SUPPORT: '/admin/support',
};

/** Default admin landing page for staff roles (navbar + post-login redirect). */
export function getStaffPanelHome(role: Role | null | undefined): string | null {
  if (!role) return null;
  const href = staffPanelHomeByRole[role];
  if (!href || filterAdminNav(role).length === 0) return null;
  return href;
}

export function getStaffPanelNav(
  role: Role | null | undefined,
): { href: string; label: string } | null {
  const href = getStaffPanelHome(role);
  if (!href) return null;
  return { href, label: 'Administración' };
}

export function isStaffPanelPath(pathname: string): boolean {
  return pathname === '/admin' || pathname.startsWith('/admin/');
}
