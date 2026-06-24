import { notFound } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { AnimatedPageShell, NeoReveal } from '@/components/motion/neo-page-transition';
import { MarkdownContent } from '@/components/content/markdown-content';
import { getServerApiClient } from '@/lib/api';

interface BlogPageProps {
  params: Promise<{ slug: string }>;
}

function formatSlugTitle(slug: string): string {
  return slug
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export async function generateMetadata({ params }: BlogPageProps) {
  const { slug } = await params;
  const api = await getServerApiClient();
  const page = await api.ai.cmsPages.findBySlug(slug).catch(() => null);
  const title = page?.title ?? formatSlugTitle(slug);
  return { title: `Artículo: ${title}` };
}

export default async function BlogPostPage({ params }: BlogPageProps) {
  const { slug } = await params;

  if (!slug) {
    notFound();
  }

  const api = await getServerApiClient();
  const page = await api.ai.cmsPages.findBySlug(slug).catch(() => null);

  if (!page) {
    notFound();
  }

  return (
    <AnimatedPageShell
      className="container mx-auto max-w-3xl px-4 py-8"
      header={<h1 className="text-3xl font-bold">{page.title}</h1>}
    >
      <NeoReveal>
        <Card className="mt-6 brutalist-card">
          <CardContent className="pt-6">
            <MarkdownContent markdown={page.bodyMarkdown} />
          </CardContent>
        </Card>
      </NeoReveal>
    </AnimatedPageShell>
  );
}
