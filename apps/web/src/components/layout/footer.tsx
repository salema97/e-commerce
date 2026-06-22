import Link from 'next/link';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t bg-muted/30">
      <div className="container mx-auto px-4 py-10">
        <div className="grid gap-8 md:grid-cols-3">
          <div>
            <h3 className="font-semibold">Store</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Your trusted local e-commerce destination.
            </p>
          </div>

          <div>
            <h3 className="font-semibold">Customer Service</h3>
            <ul className="mt-2 flex flex-col gap-1 text-sm text-muted-foreground">
              <li>
                <Link href="/orders" className="hover:text-foreground">Orders</Link>
              </li>
              <li>
                <Link href="/wishlist" className="hover:text-foreground">Wishlist</Link>
              </li>
              <li>
                <Link href="/legal/shipping" className="hover:text-foreground">Shipping Policy</Link>
              </li>
              <li>
                <Link href="/legal/returns" className="hover:text-foreground">Returns</Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold">Legal</h3>
            <ul className="mt-2 flex flex-col gap-1 text-sm text-muted-foreground">
              <li>
                <Link href="/legal/privacy" className="hover:text-foreground">Privacy Policy</Link>
              </li>
              <li>
                <Link href="/legal/terms" className="hover:text-foreground">Terms of Service</Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t pt-6 text-center text-sm text-muted-foreground">
          © {currentYear} Store. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
