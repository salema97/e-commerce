import Link from 'next/link';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t-[3px] border-neo-onyx bg-neo-onyx text-white">
      <div className="container mx-auto px-4 py-16 md:px-8">
        <div className="grid gap-12 md:grid-cols-4">
          <div className="md:col-span-2">
            <h2 className="font-anton text-6xl uppercase leading-none md:text-7xl">NEO.STORE</h2>
            <p className="mt-6 max-w-md text-lg font-bold opacity-70">
              Tu destino e-commerce local. Envíos rápidos y checkout seguro.
            </p>
          </div>

          <div>
            <h3 className="font-anton text-2xl uppercase text-neo-gold md:text-3xl">Soporte</h3>
            <ul className="mt-6 space-y-3 text-sm font-bold uppercase">
              <li>
                <Link href="/orders" className="hover:text-neo-gold">
                  Pedidos
                </Link>
              </li>
              <li>
                <Link href="/wishlist" className="hover:text-neo-gold">
                  Lista de deseos
                </Link>
              </li>
              <li>
                <Link href="/legal/shipping" className="hover:text-neo-gold">
                  Envíos
                </Link>
              </li>
              <li>
                <Link href="/legal/returns" className="hover:text-neo-gold">
                  Devoluciones
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-anton text-2xl uppercase text-neo-gold md:text-3xl">Legal</h3>
            <ul className="mt-6 space-y-3 text-sm font-bold uppercase">
              <li>
                <Link href="/legal/privacy" className="hover:text-neo-gold">
                  Privacidad
                </Link>
              </li>
              <li>
                <Link href="/legal/terms" className="hover:text-neo-gold">
                  Términos
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-16 flex flex-col items-center justify-between gap-4 border-t border-white/20 pt-8 text-xs font-bold uppercase tracking-[0.3em] opacity-50 md:flex-row">
          <p>© {currentYear} NEO.STORE. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  );
}
