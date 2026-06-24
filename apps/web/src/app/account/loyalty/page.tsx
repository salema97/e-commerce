'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useApiQueryHooks } from '@/lib/client-api';
import { formatDate } from '@repo/shared-utils';

export default function AccountLoyaltyPage() {
  const { useLoyaltyAccount, useLoyaltyTransactions } = useApiQueryHooks();
  const accountQuery = useLoyaltyAccount();
  const transactionsQuery = useLoyaltyTransactions();

  const account = accountQuery.data;
  const transactions = transactionsQuery.data ?? [];

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8 space-y-6">
      <h1 className="text-2xl font-bold">Programa de lealtad</h1>

      {account ? (
        <Card>
          <CardHeader>
            <CardTitle>Tu cuenta</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              Puntos: <strong>{account.points}</strong>
            </p>
            <p>
              Nivel: <strong>{account.tier}</strong>
            </p>
            <p>
              Valor estimado: <strong>${account.pointsValue.toFixed(2)}</strong>
            </p>
          </CardContent>
        </Card>
      ) : (
        <p className="text-sm text-muted-foreground">Cargando cuenta...</p>
      )}

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Historial</h2>
        {transactions.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sin movimientos aún.</p>
        ) : (
          <ul className="space-y-2">
            {transactions.map((tx) => (
              <li key={tx.id} className="rounded-md border p-3 text-sm">
                <p className="font-medium">
                  {tx.type} · {tx.points > 0 ? '+' : ''}
                  {tx.points} pts
                </p>
                <p className="text-muted-foreground">{tx.reason}</p>
                <p className="text-xs text-muted-foreground">{formatDate(tx.createdAt)}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
