import { listCategories } from '@/lib/public-catalog';
import { AnimatedPageShell } from '@/components/motion/neo-page-transition';
import { CategoryCardGrid } from '@/components/store/category-card-grid';

export default async function CategoriesPage() {
  const categories = await listCategories().catch(() => []);

  return (
    <AnimatedPageShell
      className="container mx-auto px-4 py-8"
      header={
        <header className="mb-10 border-b-[6px] border-neo-onyx pb-6">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-muted-foreground">Catálogo</p>
          <h1 className="font-anton text-5xl uppercase md:text-7xl">Categorías</h1>
        </header>
      }
    >
      <CategoryCardGrid categories={categories} />
    </AnimatedPageShell>
  );
}
