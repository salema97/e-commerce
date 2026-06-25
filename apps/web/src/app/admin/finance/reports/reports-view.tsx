'use client';

import * as React from 'react';
import { useApiQueryHooks, useAuthApiReady } from '@/lib/client-api';
import { AdminPageHeader } from '@/components/admin/admin-page-header';
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
import { formatDateTime, incomeSourceLabel, formatPrice } from '@repo/shared-utils';
import type { AdminStoreCredit, CashFlowReport, IncomeSource } from '@repo/shared-types';

export function ReportsView({
  initialRange,
  initialStoreCredits,
  initialCashFlow,
}: {
  initialRange: { from: string; to: string };
  initialStoreCredits: AdminStoreCredit[];
  initialCashFlow: CashFlowReport | null;
}) {
  const hooks = useApiQueryHooks();
  const authReady = useAuthApiReady();
  const fromRef = React.useRef<HTMLInputElement>(null);
  const toRef = React.useRef<HTMLInputElement>(null);
  const [applied, setApplied] = React.useState(initialRange);

  const { data: report } = hooks.useFinanceCashFlow(applied.from, applied.to, {
    enabled: authReady && Boolean(applied.from && applied.to),
    initialData:
      applied.from === initialRange.from && applied.to === initialRange.to
        ? (initialCashFlow ?? undefined)
        : undefined,
  });

  const { data: storeCredits } = hooks.useFinanceStoreCredits({
    initialData: initialStoreCredits,
    enabled: authReady,
  });

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-6">
      <AdminPageHeader
        title="Reportes"
        subtitle="Finanzas / Flujo de caja y crédito de tienda"
        showNetworkStatus={false}
      />

      <div className="neo-panel flex flex-wrap items-end gap-4 p-4">
        <div className="space-y-2">
          <Label htmlFor="from">Desde</Label>
          <Input
            id="from"
            ref={fromRef}
            type="date"
            defaultValue={initialRange.from}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="to">Hasta</Label>
          <Input
            id="to"
            ref={toRef}
            type="date"
            defaultValue={initialRange.to}
            required
          />
        </div>
        <Button
          type="button"
          onClick={() => {
            const from = fromRef.current?.value ?? initialRange.from;
            const to = toRef.current?.value ?? initialRange.to;
            setApplied({ from, to });
          }}
        >
          Generar
        </Button>
      </div>

      {report ? (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Ingresos</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-semibold">
              {formatPrice(report.totalIncome)}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Gastos</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-semibold">
              {formatPrice(report.totalExpenses)}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Flujo neto</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-semibold">
              {formatPrice(report.netCashFlow)}
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
                  <span>{incomeSourceLabel(source as IncomeSource)}</span>
                  <span>{formatPrice(Number(value))}</span>
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
                  <span>{formatPrice(Number(value))}</span>
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
        <h2 className="font-anton text-xl uppercase">Crédito de tienda</h2>
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
            {(storeCredits ?? []).map((credit: AdminStoreCredit) => (
              <TableRow key={credit.id}>
                <TableCell>{credit.userEmail ?? credit.userId}</TableCell>
                <TableCell>{formatPrice(credit.balance, { currency: credit.currency })}</TableCell>
                <TableCell>
                  {credit.expiresAt ? formatDateTime(credit.expiresAt) : '—'}
                </TableCell>
                <TableCell>{formatDateTime(credit.updatedAt)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
