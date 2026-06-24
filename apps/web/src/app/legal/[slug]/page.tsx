import { notFound } from 'next/navigation';
import { getServerApiClient } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface LegalPageProps {
  params: Promise<{ slug: string }>;
}

const LEGAL_TITLES: Record<string, string> = {
  privacy: 'Política de privacidad',
  terms: 'Términos de servicio',
  shipping: 'Política de envíos',
  returns: 'Política de devoluciones',
};

const CMS_SLUG_BY_LEGAL: Record<string, string> = {
  privacy: 'legal-privacidad',
  terms: 'legal-terminos',
  shipping: 'legal-envios',
  returns: 'legal-devoluciones',
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

  const api = getServerApiClient();
  const cmsSlug = CMS_SLUG_BY_LEGAL[slug];
  let body: string | null = null;

  try {
    const page = await api.ai.getCmsPage(cmsSlug);
    body = page?.bodyMarkdown ?? null;
  } catch {
    body = null;
  }

  return (
    <div className="container mx-auto max-w-3xl px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">{title}</CardTitle>
        </CardHeader>
        <CardContent className="prose dark:prose-invert max-w-none whitespace-pre-wrap">
          {body ?? (
            <p className="text-muted-foreground">
              Contenido legal en preparación. Contacta a soporte si necesitas una copia actualizada.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
