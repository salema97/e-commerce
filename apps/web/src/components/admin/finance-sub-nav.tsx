'use client';

import { AdminSectionNav } from '@/components/admin/admin-section-nav';

const financeLinks = [
  { href: '/admin/finance', label: 'Resumen', exact: true },
  { href: '/admin/finance/incomes', label: 'Ingresos' },
  { href: '/admin/finance/expenses', label: 'Gastos' },
  { href: '/admin/finance/categories', label: 'Categorías' },
  { href: '/admin/finance/suppliers', label: 'Proveedores' },
  { href: '/admin/finance/reports', label: 'Reportes' },
  { href: '/admin/finance/store-credits', label: 'Crédito tienda' },
  { href: '/admin/finance/gift-cards', label: 'Gift cards' },
];

export function FinanceSubNav() {
  return <AdminSectionNav basePath="/admin/finance" items={financeLinks} />;
}
