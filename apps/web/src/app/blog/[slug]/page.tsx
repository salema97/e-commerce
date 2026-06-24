import { notFound } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { AnimatedPageShell, NeoReveal } from '@/components/motion/neo-page-transition';

interface BlogPageProps {
  params: Promise<{ slug: string }>;
}

const BLOG_TITLES: Record<string, string> = {
  'guia-compras-online': 'Guía de compras online',
  'cuidado-productos': 'Cómo cuidar tus productos',
};

function formatSlugTitle(slug: string): string {
  return slug
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export async function generateMetadata({ params }: BlogPageProps) {
  const { slug } = await params;
  const title = BLOG_TITLES[slug] ?? formatSlugTitle(slug);
  return { title: `Artículo: ${title}` };
}

export default async function BlogPostPage({ params }: BlogPageProps) {
  const { slug } = await params;
  const title = BLOG_TITLES[slug] ?? formatSlugTitle(slug);

  if (!slug) {
    notFound();
  }

  return (
    <AnimatedPageShell
      className="container mx-auto max-w-3xl px-4 py-8"
      header={<h1 className="text-3xl font-bold">{title}</h1>}
    >
      <NeoReveal>
        <Card className="mt-6">
          <CardContent className="pt-6">
            <p className="text-muted-foreground">
              Artículo del blog gestionado por CMS (placeholder). El contenido de esta
              publicación se cargará desde el panel de administración cuando la
              integración CMS esté disponible.
            </p>
          </CardContent>
        </Card>
      </NeoReveal>
    </AnimatedPageShell>
  );
}
