'use client';

import { Button } from '@/components/ui/button';

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="es">
      <body className="flex min-h-screen items-center justify-center bg-neo-lace px-4">
        <div className="border-[3px] border-neo-onyx bg-white p-8 text-center shadow-[8px_8px_0_0_#111111]">
          <h2 className="font-anton text-3xl uppercase">Algo salió mal</h2>
          <Button type="button" onClick={reset} className="mt-6">
            Reintentar
          </Button>
        </div>
      </body>
    </html>
  );
}
