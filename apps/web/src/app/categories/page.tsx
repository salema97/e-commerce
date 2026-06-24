import Link from 'next/link';
import { getServerApiClient } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default async function CategoriesPage() {
  const api = await getServerApiClient();
  let categories = await api.categories.findAll().catch(() => []);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold">Categories</h1>
      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {categories.map((category) => (
          <Link key={category.id} href={`/store?category=${category.slug}`}>
            <Card className="hover:border-primary/50 transition-colors">
              <CardHeader>
                <CardTitle className="text-base">{category.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {category.description ?? 'Explore products in this category.'}
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
