import type { Metadata } from 'next';
import { Anton, Space_Grotesk } from 'next/font/google';
import { Providers } from './providers';
import { StoreChrome } from '@/components/layout/store-chrome';
import ServiceWorkerRegistration from '@/components/pwa/service-worker-registration';
import './globals.css';

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
  weight: ['400', '500', '700'],
});

const anton = Anton({
  subsets: ['latin'],
  variable: '--font-anton',
  weight: '400',
});

export const metadata: Metadata = {
  title: {
    default: 'NEO.STORE',
    template: '%s | NEO.STORE',
  },
  description: 'Tu tienda online local.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${spaceGrotesk.variable} ${anton.variable}`}>
      <body className="min-h-screen flex flex-col overflow-x-clip font-sans antialiased">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:m-2 focus:border-[3px] focus:border-neo-onyx focus:bg-neo-gold focus:px-3 focus:py-2 focus:font-bold focus:uppercase"
        >
          Saltar al contenido
        </a>
        <Providers>
          <StoreChrome>
            <main id="main-content" className="flex min-h-screen flex-1 flex-col">
              {children}
            </main>
          </StoreChrome>
          <ServiceWorkerRegistration />
        </Providers>
      </body>
    </html>
  );
}
