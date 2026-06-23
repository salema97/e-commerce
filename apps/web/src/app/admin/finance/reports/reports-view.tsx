'use client';

import * as React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { useApiClient } from '@/lib/client-api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDateTime } from '@repo/shared-utils';
import type { AdminStoreCredit } from '@repo/shared-types';

function formatMoney(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat('es-EC', {
    style: 'currency',
    currency,
  }).format(amount);
}

function defaultMonthRange(): { from: string; to: string } {
  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth(), 1);
  const to = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return {
    from: from.toISOString().slice(0, 10),
    to: to.toISOString().slice(0, 10),
  };
}

export function ReportsView() {
  const api = useApiClient();
  const defaults = React.useMemo(() => defaultMonthRange(), []);
  const [from, setFrom] = React.useState(defaults.from);
  const [to, setTo] = React.useState(defaults.to);
  const [applied, setApplied] = React.useState(defaults);

  const cashFlowQuery = useQuery({
    queryKey: ['finance', 'cash-flow', applied.from, applied.to],
    queryFn: () => api.finance.reports.cashFlow(applied.from, applied.to),
    enabled: Boolean(applied.from && applied.to),
  });

  const storeCreditsQuery = useQuery({
    queryKey: ['finance', 'store-credits'],
    queryFn: () => api.finance.storeCredits.findAll(),
  });

  const report = cashFlowQuery.data;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">Reportes financieros</h1>
        <p className="text-sm text-muted-foreground">
          <Link href="/admin/finance" className="underline">
            Finanzas
          </Link>
          {' / Reportes'}
        </p>
      </div>

      <form
        className="flex flex-wrap items-end gap-4 rounded-lg border p-4"
        onSubmit={(event) => {
          event.preventDefault();
          setApplied({ from, to });
        }}
      >
        <div className="space-y-2">
          <Label htmlFor="from">Desde</Label>
          <Input
            id="from"
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="to">Hasta</Label>
          <Input
            id="to"
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            required
          />
        </div>
        <Button type="submit">Generar</Button>
      </form>

      {cashFlowQuery.isLoading ? (
        <Skeleton className="h-40 w-full" />
      ) : report ? (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Ingresos</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-semibold">
              {formatMoney(report.totalIncome)}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Gastos</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-semibold">
              {formatMoney(report.totalExpenses)}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Flujo neto</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-semibold">
              {formatMoney(report.netCashFlow)}
            </CardContent>
          </Card>
        </div>
      ) : null}

      {report ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Ingresos por fuente</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {Object.entries(report.incomeBySource).map(([source, value]) => (
                <div key={source} className="flex justify-between">
                  <span>{source}</span>
                  <span>{formatMoney(Number(value))}</span>
                </div>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Gastos por categoría</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {Object.entries(report.expensesByCategory).map(([category, value]) => (
                <div key={category} className="flex justify-between">
                  <span>{category}</span>
                  <span>{formatMoney(Number(value))}</span>
                </div>
              ))}
              {Object.keys(report.expensesByCategory).length === 0 ? (
                <p className="text-muted-foreground">Sin gastos en el período.</p>
              ) : null}
            </CardContent>
          </Card>
        </div>
      ) : null}

      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Crédito de tienda</h2>
        {storeCreditsQuery.isLoading ? (
          <Skeleton className="h-32 w-full" />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuario</TableHead>
                <TableHead>Saldo</TableHead>
                <TableHead>Expira</TableHead>
                <TableHead>Actualizado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(storeCreditsQuery.data ?? []).map((credit: AdminStoreCredit) => (
                <TableRow key={credit.id}>
                  <TableCell>
                    {credit.userEmail ?? credit.userId}
                  </TableCell>
                  <TableCell>
                    {formatMoney(credit.balance, credit.currency)}
                  </TableCell>
                  <TableCell>
                    {credit.expiresAt ? formatDateTime(credit.expiresAt) : '—'}
                  </TableCell>
                  <TableCell>{formatDateTime(credit.updatedAt)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
