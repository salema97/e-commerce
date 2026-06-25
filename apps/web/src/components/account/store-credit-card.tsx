'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useApiClient, useAuthApiReady } from '@/lib/client-api';
import { formatPrice } from '@repo/shared-utils';
import type { StoreCreditBalance } from '@repo/shared-types';

interface StoreCreditCardProps {
  initialBalance: StoreCreditBalance | null;
}

export function StoreCreditCard({ initialBalance }: StoreCreditCardProps) {
  const api = useApiClient();
  const authReady = useAuthApiReady();

  const { data } = useQuery({
    queryKey: ['returns', 'store-credit'],
    queryFn: () => api.returns.myStoreCredit(),
    initialData: initialBalance ?? undefined,
    enabled: authReady,
  });

  if (!data) {
    return null;
  }

  return (
    <Card className="brutalist-card">
      <CardHeader>
        <CardTitle>Crédito en tienda</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <p className="font-anton text-4xl">{formatPrice(data.balance)}</p>
        {data.expiresAt ? (
          <p className="text-sm text-muted-foreground">
            Válido hasta {new Date(data.expiresAt).toLocaleDateString('es-EC')}
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">
            Saldo disponible para tu próxima compra.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
