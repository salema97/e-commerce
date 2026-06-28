import type { Metadata } from 'next';
import { listCategories } from '@/lib/public-catalog';
import { AnimatedPageShell, NeoPageHeader } from '@/components/motion/neo-page-transition';
import { CategoryBentoGrid } from '@/components/home/category-bento-grid';

export const metadata: Metadata = {
  title: 'Categorías',
  description: 'Explora todas las categorías de productos.',
};

export default async function CategoriesPage() {
  const categories = await listCategories().catch(() => []);

  return (
    <AnimatedPageShell
      className="container mx-auto px-4 py-8 md:px-8"
      header={
        <NeoPageHeader eyebrow="Catálogo" title="Categorías" className="mb-10 border-b-[6px] border-neo-onyx pb-6" />
      }
    >
      {categories.length > 0 ? (
        <CategoryBentoGrid categories={categories} />
      ) : (
        <div className="border-[3px] border-dashed border-neo-onyx py-20 text-center font-bold uppercase text-muted-foreground">
          No hay categorías disponibles.
        </div>
      )}
    </AnimatedPageShell>
  );
}
