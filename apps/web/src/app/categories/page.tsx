import Link from 'next/link';
import { getServerApiClient } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default async function CategoriesPage() {
  const api = await getServerApiClient();
  const categories = await api.categories.findAll().catch(() => []);

  return (
    <div className="container mx-auto px-4 py-8">
      <header className="mb-10 border-b-[6px] border-neo-onyx pb-6">
        <p className="text-xs font-bold uppercase tracking-[0.3em] text-muted-foreground">Catálogo</p>
        <h1 className="font-anton text-5xl uppercase md:text-7xl">Categorías</h1>
      </header>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {categories.map((category) => (
          <Link key={category.id} href={`/store?category=${category.slug}`}>
            <Card className="transition-transform hover:-translate-x-1 hover:-translate-y-1 hover:shadow-[10px_10px_0_0_#111111]">
              <CardHeader>
                <CardTitle>{category.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm font-bold uppercase tracking-wide text-muted-foreground line-clamp-2">
                  {category.description ?? 'Explorar productos de esta categoría.'}
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
