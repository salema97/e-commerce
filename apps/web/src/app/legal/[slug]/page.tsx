import { notFound } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { AnimatedPageShell, NeoReveal } from '@/components/motion/neo-page-transition';

interface LegalPageProps {
  params: Promise<{ slug: string }>;
}

const LEGAL_TITLES: Record<string, string> = {
  privacy: 'Política de privacidad',
  terms: 'Términos de servicio',
  shipping: 'Política de envíos',
  returns: 'Política de devoluciones',
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
    <AnimatedPageShell
      className="container mx-auto max-w-3xl px-4 py-8"
      header={<h1 className="text-3xl font-bold">{title}</h1>}
    >
      <NeoReveal>
        <Card className="mt-6">
          <CardContent className="prose dark:prose-invert pt-6">
            <p className="text-muted-foreground">
              Contenido legal gestionado por CMS (placeholder). La versión completa de{' '}
              {title.toLowerCase()} se editará desde el panel de administración cuando la
              integración CMS esté disponible.
            </p>
          </CardContent>
        </Card>
      </NeoReveal>
    </AnimatedPageShell>
  );
}
