'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useApiClient } from '@/lib/client-api';
import type { BulkImportResult } from '@repo/shared-types';

const SAMPLE_CSV = `name,slug,sku,price,categorySlug,stock,status,description
Camiseta,camiseta,CAM-001,19.99,ropa,50,ACTIVE,Camiseta algodón`;

export function ProductsImportPanel() {
  const api = useApiClient();
  const router = useRouter();
  const [csv, setCsv] = React.useState(SAMPLE_CSV);
  const [result, setResult] = React.useState<BulkImportResult | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setResult(null);
    try {
      const response = await api.bulkImport.importProducts(csv);
      setResult(response);
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Import failed');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-anton text-xl uppercase">Importar productos (CSV)</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={(event) => void handleSubmit(event)}>
          <div className="space-y-2">
            <Label htmlFor="products-csv">CSV</Label>
            <Textarea
              id="products-csv"
              rows={12}
              value={csv}
              onChange={(event) => setCsv(event.target.value)}
              className="font-mono text-sm"
            />
            <p className="text-muted-foreground text-sm">
              Columnas: name, slug, price (requeridas); sku, categorySlug, stock, status, description
              (opcionales).
            </p>
          </div>
          {error ? <p className="text-destructive text-sm">{error}</p> : null}
          {result ? (
            <div className="space-y-2 text-sm">
              <p>
                Filas: {result.totalRows} · Creados: {result.created} · Actualizados: {result.updated}{' '}
                · Fallidos: {result.failed}
              </p>
              {result.errors.length > 0 ? (
                <ul className="text-destructive list-disc pl-5">
                  {result.errors.map((rowError) => (
                    <li key={`${rowError.row}-${rowError.message}`}>
                      Fila {rowError.row}: {rowError.message}
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          ) : null}
          <Button type="submit" disabled={isSubmitting} className="font-anton uppercase">
            {isSubmitting ? 'Importando…' : 'Importar'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
