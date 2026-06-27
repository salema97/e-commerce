'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useApiClient } from '@/lib/client-api';

interface BackInStockFormProps {
  productId: string;
}

export function BackInStockForm({ productId }: BackInStockFormProps): React.ReactElement {
  const api = useApiClient();
  const [email, setEmail] = React.useState('');
  const [status, setStatus] = React.useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = React.useState('');

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setStatus('loading');
    setMessage('');

    try {
      await api.products.subscribeBackInStock(productId, { email });
      setStatus('success');
      setMessage('Te avisaremos cuando vuelva a haber stock.');
    } catch {
      setStatus('error');
      setMessage('No pudimos registrar tu alerta. Intenta de nuevo.');
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-4 space-y-3 border-[3px] border-neo-onyx bg-white p-4 shadow-[6px_6px_0_0_#111111]"
    >
      <p className="font-bold uppercase">Avísame cuando haya stock</p>
      <div className="space-y-2">
        <Label htmlFor={`back-in-stock-${productId}`}>Correo electrónico</Label>
        <Input
          id={`back-in-stock-${productId}`}
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="tu@correo.com"
        />
      </div>
      <Button type="submit" disabled={status === 'loading'}>
        {status === 'loading' ? 'Registrando…' : 'Suscribirme'}
      </Button>
      {message ? (
        <p className={status === 'error' ? 'text-sm text-destructive' : 'text-sm text-muted-foreground'}>
          {message}
        </p>
      ) : null}
    </form>
  );
}
