import { notFound } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface LegalPageProps {
  params: Promise<{ slug: string }>;
}

const LEGAL_TITLES: Record<string, string> = {
  privacy: 'Privacy Policy',
  terms: 'Terms of Service',
  shipping: 'Shipping Policy',
  returns: 'Return Policy',
};

export async function generateMetadata({ params }: LegalPageProps) {
  const { slug } = await params;
  return { title: LEGAL_TITLES[slug] ?? slug };
}

export default async function LegalPage({ params }: LegalPageProps) {
  const { slug } = await params;
  const title = LEGAL_TITLES[slug];

  if (!title) {
    notFound();
  }

  return (
    <div className="container mx-auto max-w-3xl px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">{title}</CardTitle>
        </CardHeader>
        <CardContent className="prose dark:prose-invert">
          <p className="text-muted-foreground">
            CMS-driven legal content placeholder. The full {title.toLowerCase()}{' '}
            will be managed from the admin CMS once Phase 3 CMS integration is
            completed.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
