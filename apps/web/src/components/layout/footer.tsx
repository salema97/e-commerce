import Link from 'next/link';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t bg-muted/30" role="contentinfo">
      <div className="container mx-auto px-4 py-10">
        <div className="grid gap-8 md:grid-cols-3">
          <div>
            <h3 className="font-semibold">Tienda</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Tu destino de compras en línea en Ecuador.
            </p>
          </div>

          <div>
            <h3 className="font-semibold">Atención al cliente</h3>
            <ul className="mt-2 flex flex-col gap-1 text-sm text-muted-foreground">
              <li>
                <Link href="/orders" className="hover:text-foreground">Pedidos</Link>
              </li>
              <li>
                <Link href="/wishlist" className="hover:text-foreground">Lista de deseos</Link>
              </li>
              <li>
                <Link href="/legal/shipping" className="hover:text-foreground">Política de envíos</Link>
              </li>
              <li>
                <Link href="/legal/returns" className="hover:text-foreground">Devoluciones</Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold">Legal</h3>
            <ul className="mt-2 flex flex-col gap-1 text-sm text-muted-foreground">
              <li>
                <Link href="/legal/privacy" className="hover:text-foreground">Política de privacidad</Link>
              </li>
              <li>
                <Link href="/legal/terms" className="hover:text-foreground">Términos de servicio</Link>
              </li>
              <li>
                <Link href="/account/privacy" className="hover:text-foreground">Privacidad y datos</Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t pt-6 text-center text-sm text-muted-foreground">
          © {currentYear} Tienda. Todos los derechos reservados.
        </div>
      </div>
    </footer>
  );
}
