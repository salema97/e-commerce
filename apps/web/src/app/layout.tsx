import type { Metadata } from 'next';
import { Anton, Space_Grotesk } from 'next/font/google';
import { Providers } from './providers';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
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
      <body className="min-h-screen flex flex-col font-sans antialiased overflow-x-clip">
        <Providers>
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
          <ServiceWorkerRegistration />
        </Providers>
      </body>
    </html>
  );
}
