import { notFound } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { AnimatedPageShell, NeoReveal } from '@/components/motion/neo-page-transition';
import { MarkdownContent } from '@/components/content/markdown-content';
import { findCmsPageBySlug } from '@/lib/public-catalog';
import { LEGAL_PATH_TITLES, resolveLegalCmsSlug } from '@repo/shared-utils';

interface LegalPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: LegalPageProps) {
  const { slug } = await params;
  return { title: LEGAL_PATH_TITLES[slug] ?? slug };
}

export default async function LegalPage({ params }: LegalPageProps) {
  const { slug } = await params;
  const fallbackTitle = LEGAL_PATH_TITLES[slug];

  if (!fallbackTitle) {
    notFound();
  }

  const cmsSlug = resolveLegalCmsSlug(slug);
  const page = await findCmsPageBySlug(cmsSlug);

  if (!page) {
    notFound();
  }

  return (
    <AnimatedPageShell
      className="container mx-auto max-w-3xl px-4 py-8"
      header={<h1 className="font-anton text-4xl uppercase md:text-5xl">{page.title}</h1>}
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
