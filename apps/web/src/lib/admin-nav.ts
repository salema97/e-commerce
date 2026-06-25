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
  { href: '/admin/reviews', label: 'Reseñas', roles: ['SUPER_ADMIN', 'ADMIN'], group: 'sales' },
  { href: '/admin/referrals', label: 'Referidos', roles: ['SUPER_ADMIN', 'ADMIN', 'FINANCE'], group: 'sales' },
  { href: '/admin/b2b', label: 'B2B', roles: ['SUPER_ADMIN', 'ADMIN'], group: 'sales' },
  { href: '/admin/quotes', label: 'Cotizaciones', roles: ['SUPER_ADMIN', 'ADMIN', 'FINANCE'], group: 'sales' },
  { href: '/admin/marketplace', label: 'Marketplace', roles: ['SUPER_ADMIN', 'ADMIN', 'INVENTORY'], group: 'sales' },
  { href: '/admin/pos', label: 'POS / Tiendas', roles: ['SUPER_ADMIN', 'ADMIN', 'INVENTORY'], group: 'sales' },
  { href: '/admin/sellers', label: 'Vendedores', roles: ['SUPER_ADMIN', 'ADMIN'], group: 'sales' },
  { href: '/admin/subscriptions', label: 'Suscripciones', roles: ['SUPER_ADMIN', 'ADMIN', 'FINANCE'], group: 'sales' },
  { href: '/admin/marketing', label: 'Marketing', roles: ['SUPER_ADMIN', 'ADMIN'], group: 'sales' },
  { href: '/admin/analytics', label: 'Analítica', roles: ['SUPER_ADMIN', 'ADMIN', 'FINANCE'], group: 'sales' },
  { href: '/admin/support', label: 'Soporte', roles: ['SUPER_ADMIN', 'ADMIN', 'SUPPORT'], group: 'support' },
  { href: '/admin/knowledge', label: 'Conocimiento', roles: ['SUPER_ADMIN', 'ADMIN', 'SUPPORT'], group: 'knowledge' },
  { href: '/admin/invoices', label: 'Facturación', roles: ['SUPER_ADMIN', 'ADMIN', 'FINANCE'], group: 'finance' },
  { href: '/admin/accounting', label: 'Contabilidad', roles: ['SUPER_ADMIN', 'ADMIN', 'FINANCE'], group: 'finance' },
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

  const match = adminNavItems.reduce<AdminNavItem | undefined>((best, item) => {
    if (normalized !== item.href && !normalized.startsWith(`${item.href}/`)) {
      return best;
    }
    if (!best || item.href.length > best.href.length) {
      return item;
    }
    return best;
  }, undefined);

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
