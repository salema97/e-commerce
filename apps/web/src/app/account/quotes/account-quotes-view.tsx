'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button-variants';
import { AnimatedPageShell } from '@/components/motion/neo-page-transition';
import { useApiClient, useAuthApiReady } from '@/lib/client-api';
import { queryKeys } from '@repo/api-client';
import { formatPrice } from '@repo/shared-utils';
import type { Quote } from '@repo/shared-types';
import { cn } from '@/lib/utils';

interface AccountQuotesViewProps {
  initialQuotes: Quote[];
}

export function AccountQuotesView({ initialQuotes }: AccountQuotesViewProps) {
  const api = useApiClient();
  const authReady = useAuthApiReady();

  const { data: quotes = initialQuotes } = useQuery({
    queryKey: queryKeys.quotes('me'),
    queryFn: () => api.quotes.mine(),
    initialData: initialQuotes,
    enabled: authReady,
  });

  return (
    <AnimatedPageShell
      className="container mx-auto max-w-3xl px-4 py-8"
      header={
        <header className="mb-6 flex flex-col gap-4 border-b-[6px] border-neo-onyx pb-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-muted-foreground">
              Mi cuenta
            </p>
            <h1 className="font-anton text-4xl uppercase md:text-5xl">Mis cotizaciones</h1>
          </div>
          <Link href="/account" className={cn(buttonVariants({ variant: 'outline' }), 'w-fit')}>
            Volver a cuenta
          </Link>
        </header>
      }
    >
      <div className="space-y-6">
        {quotes.length === 0 ? (
          <p className="text-muted-foreground">No tienes cotizaciones activas.</p>
        ) : (
          quotes.map((quote) => (
            <Card key={quote.id} className="brutalist-card">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base">{quote.quoteNumber}</CardTitle>
                <Badge>{quote.status}</Badge>
              </CardHeader>
              <CardContent className="space-y-1 text-sm">
                <p>Total: {formatPrice(quote.total)}</p>
                <p>Vence: {new Date(quote.expiresAt).toLocaleDateString('es-EC')}</p>
                {quote.convertedOrderId ? (
                  <p className="text-muted-foreground">Orden: {quote.convertedOrderId}</p>
                ) : null}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </AnimatedPageShell>
  );
}
