import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Providers } from './providers';
import { AnalyticsProvider } from '@/components/analytics/analytics-provider';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import ServiceWorkerRegistration from '@/components/pwa/service-worker-registration';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
});

export const metadata: Metadata = {
  title: {
    default: 'E-commerce Store',
    template: '%s | E-commerce Store',
  },
  description: 'Your local e-commerce destination.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={inter.variable}>
      <body className="min-h-screen flex flex-col font-sans antialiased">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:m-2 focus:rounded focus:bg-background focus:px-3 focus:py-2 focus:ring-2 focus:ring-primary"
        >
          Saltar al contenido
        </a>
        <Providers>
          <AnalyticsProvider>
            <Navbar />
            <main id="main-content" className="flex-1">
              {children}
            </main>
            <Footer />
            <ServiceWorkerRegistration />
          </AnalyticsProvider>
        </Providers>
      </body>
    </html>
  );
}
