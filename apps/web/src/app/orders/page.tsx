import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getServerApiClient } from '@/lib/api';
import { getSession } from '@/lib/session';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatPrice, orderStatusLabel } from '@repo/shared-utils';
import type { Order } from '@repo/shared-types';

export default async function OrdersPage() {
  const session = await getSession();
  if (!session) {
    redirect('/sign-in?redirect_url=/orders');
  }

  const api = await getServerApiClient();
  let orders: Order[] = [];
  try {
    const result = await api.orders.findAll({ limit: 50 });
    orders = result.data ?? [];
  } catch {
    orders = [];
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold">Historial de pedidos</h1>

      {orders.length === 0 ? (
        <div className="mt-8 text-center">
          <p className="text-muted-foreground">Aún no has realizado ningún pedido.</p>
          <Link href="/store">
            <Button className="mt-4">Empezar a comprar</Button>
          </Link>
        </div>
      ) : (
        <div className="mt-8 grid gap-4">
          {orders.map((order) => (
            <Link key={order.id} href={`/orders/${order.id}`}>
              <Card className="hover:border-primary/50 transition-colors">
                <CardContent className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-semibold">{order.orderNumber}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <Badge variant="outline">{orderStatusLabel(order.status)}</Badge>
                    <span className="font-semibold">{formatPrice(order.total)}</span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
