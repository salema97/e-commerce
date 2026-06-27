import Link from 'next/link';
import { listPublishedFaqs } from '@/lib/public-catalog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AnimatedPageShell, NeoReveal, NeoStagger } from '@/components/motion/neo-page-transition';

export default async function HelpPage() {
  const faqs = await listPublishedFaqs();

  return (
    <AnimatedPageShell
      className="container mx-auto max-w-3xl px-4 py-8"
      header={
        <header className="mb-6 border-b-[6px] border-neo-onyx pb-4">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-muted-foreground">
            Soporte
          </p>
          <h1 className="font-anton text-4xl uppercase md:text-5xl">Preguntas frecuentes</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            ¿No encuentras respuesta?{' '}
            <Link href="/store" className="font-bold underline">
              Abre el chat en la tienda
            </Link>
            .
          </p>
        </header>
      }
    >
      <NeoStagger className="flex flex-col gap-4">
        {faqs.map((faq) => (
          <NeoReveal key={faq.id}>
            <Card className="brutalist-card">
              <CardHeader>
                <CardTitle className="text-base uppercase">{faq.question}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap text-sm text-muted-foreground">{faq.answer}</p>
              </CardContent>
            </Card>
          </NeoReveal>
        ))}
      </NeoStagger>
    </AnimatedPageShell>
  );
}
