import { notFound } from 'next/navigation';
import { getServerApiClient } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface BlogPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: BlogPageProps) {
  const { slug } = await params;
  return { title: `Blog: ${slug}` };
}

export default async function BlogPostPage({ params }: BlogPageProps) {
  const { slug } = await params;

  return (
    <div className="container mx-auto px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl capitalize">{slug.replace(/-/g, ' ')}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            CMS-driven blog content placeholder. The content for this post will
            be loaded from the CMS once Phase 3 CMS integration is completed.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
