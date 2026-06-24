export default function OfflinePage() {
  return (
    <div className="container mx-auto px-4 py-16 text-center">
      <h1 className="text-2xl font-semibold">Estás sin conexión</h1>
      <p className="mt-2 text-muted-foreground">
        Algunas páginas pueden seguir disponibles desde la caché.
      </p>
    </div>
  );
}
