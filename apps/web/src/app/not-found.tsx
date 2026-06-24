import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function NotFoundPage() {
  return (
    <div className="container mx-auto flex flex-1 flex-col items-center justify-center px-4 py-16 text-center">
      <h1 className="text-4xl font-bold">404</h1>
      <p className="mt-2 text-lg text-muted-foreground">Página no encontrada.</p>
      <Link href="/">
        <Button className="mt-6">Ir al inicio</Button>
      </Link>
    </div>
  );
}
