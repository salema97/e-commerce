'use client';

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="es">
      <body className="flex min-h-screen items-center justify-center px-4">
        <div className="text-center">
          <h2 className="text-2xl font-semibold">Algo salió mal</h2>
          <button
            onClick={reset}
            className="mt-4 rounded-md bg-primary px-4 py-2 text-primary-foreground"
          >
            Reintentar
          </button>
        </div>
      </body>
    </html>
  );
}
