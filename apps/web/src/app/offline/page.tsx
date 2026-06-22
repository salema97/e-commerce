export default function OfflinePage() {
  return (
    <div className="container mx-auto px-4 py-16 text-center">
      <h1 className="text-2xl font-semibold">You are offline</h1>
      <p className="mt-2 text-muted-foreground">
        Some pages may still be available from the cache.
      </p>
    </div>
  );
}
