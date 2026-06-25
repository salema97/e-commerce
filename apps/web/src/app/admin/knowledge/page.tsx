import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AnimatedPageShell, NeoReveal } from '@/components/motion/neo-page-transition';
import { AdminPageHeader } from '@/components/admin/admin-page-header';

const sections = [
  {
    href: '/admin/knowledge/faqs',
    title: 'Preguntas frecuentes',
    description: 'Gestiona las FAQ publicadas en la tienda y el bot de soporte.',
  },
  {
    href: '/admin/knowledge/cms',
    title: 'Páginas CMS',
    description: 'Contenido legal, blog y páginas editables sin desplegar código.',
  },
];

export default function AdminKnowledgePage() {
  return (
    <AnimatedPageShell
      className="flex min-h-0 flex-1 flex-col gap-6"
      header={
        <AdminPageHeader
          title="Conocimiento"
          subtitle="FAQ, CMS y base de conocimiento para IA"
          showNetworkStatus={false}
        />
      }
    >
      <div className="grid gap-4 md:grid-cols-2">
        {sections.map((section) => (
          <NeoReveal key={section.href}>
            <Link href={section.href} className="block h-full">
              <Card className="h-full transition-transform hover:-translate-y-1 hover:bg-neo-gold/15">
                <CardHeader>
                  <CardTitle className="text-lg uppercase">{section.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{section.description}</p>
                </CardContent>
              </Card>
            </Link>
          </NeoReveal>
        ))}
      </div>
    </AnimatedPageShell>
  );
}
