'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useApiQueryHooks } from '@/lib/client-api';
import { formatPrice } from '@repo/shared-utils';

export default function AccountQuotesPage() {
  const { useQuotes } = useApiQueryHooks();
  const quotesQuery = useQuotes('me');
  const quotes = quotesQuery.data ?? [];

  return (
    <div className="container mx-auto max-w-3xl px-4 py-8 space-y-6">
      <h1 className="text-2xl font-bold">Mis cotizaciones</h1>

      {quotes.length === 0 ? (
        <p className="text-muted-foreground">No tienes cotizaciones activas.</p>
      ) : (
        quotes.map((quote) => (
          <Card key={quote.id}>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">{quote.quoteNumber}</CardTitle>
              <Badge>{quote.status}</Badge>
            </CardHeader>
            <CardContent className="text-sm space-y-1">
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
  );
}
