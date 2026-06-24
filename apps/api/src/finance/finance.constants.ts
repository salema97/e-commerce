import { Role } from '../auth/role.enum.js';

/** Roles con acceso a módulos de finanzas (ingresos, gastos, reportes, crédito). */
export const FINANCE_ROLES = [Role.SUPER_ADMIN, Role.ADMIN, Role.FINANCE] as const;
