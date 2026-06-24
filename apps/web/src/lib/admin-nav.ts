import type { Role } from '@repo/shared-types';

export interface AdminNavItem {
  href: string;
  label: string;
  roles: Role[];
  group: 'catalog' | 'sales' | 'support' | 'finance';
}

export const adminNavItems: AdminNavItem[] = [
  { href: '/admin/dashboard', label: 'Panel', roles: ['SUPER_ADMIN', 'ADMIN'], group: 'catalog' },
  { href: '/admin/products', label: 'Productos', roles: ['SUPER_ADMIN', 'ADMIN'], group: 'catalog' },
  { href: '/admin/categories', label: 'Categorías', roles: ['SUPER_ADMIN', 'ADMIN'], group: 'catalog' },
  { href: '/admin/inventory', label: 'Inventario', roles: ['SUPER_ADMIN', 'ADMIN', 'INVENTORY'], group: 'catalog' },
  { href: '/admin/orders', label: 'Pedidos', roles: ['SUPER_ADMIN', 'ADMIN'], group: 'sales' },
  { href: '/admin/returns', label: 'Devoluciones', roles: ['SUPER_ADMIN', 'ADMIN'], group: 'sales' },
  { href: '/admin/customers', label: 'Clientes', roles: ['SUPER_ADMIN', 'ADMIN'], group: 'sales' },
  { href: '/admin/support', label: 'Soporte', roles: ['SUPER_ADMIN', 'ADMIN', 'SUPPORT'], group: 'support' },
  { href: '/admin/invoices', label: 'Facturación', roles: ['SUPER_ADMIN', 'ADMIN', 'FINANCE'], group: 'finance' },
  { href: '/admin/finance', label: 'Finanzas', roles: ['SUPER_ADMIN', 'ADMIN', 'FINANCE'], group: 'finance' },
];

export function filterAdminNav(role: Role): AdminNavItem[] {
  return adminNavItems.filter((item) => item.roles.includes(role));
}

export function adminNavLabelForPath(pathname: string): string {
  const match = adminNavItems.find(
    (item) => pathname === item.href || pathname.startsWith(`${item.href}/`),
  );
  return match?.label ?? 'Administración';
}
