'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDate } from '@repo/shared-utils';
import type { LoyaltyAccount, LoyaltyTransaction } from '@repo/shared-types';

interface AccountLoyaltyPanelProps {
  initialAccount: LoyaltyAccount | null;
  initialTransactions: LoyaltyTransaction[];
}

export function AccountLoyaltyPanel({
  initialAccount,
  initialTransactions,
}: AccountLoyaltyPanelProps) {
  const account = initialAccount;
  const transactions = initialTransactions;

  return (
    <div className="space-y-6">
      {account ? (
        <Card className="brutalist-card">
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
        <p className="text-sm text-muted-foreground">No tienes cuenta de lealtad activa.</p>
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
