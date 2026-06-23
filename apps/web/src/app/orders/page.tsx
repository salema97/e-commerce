import { redirect } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@clerk/nextjs/server';
import { getServerApiClient } from '@/lib/api';
import { getTestAuthSession } from '@/lib/test-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatPrice, orderStatusLabel } from '@repo/shared-utils';
import type { Order } from '@repo/shared-types';

export default async function OrdersPage() {
  const { userId } = await auth();
  const testSession = await getTestAuthSession();
  if (!userId && !testSession) {
    redirect('/sign-in?redirect_url=/orders');
  }

  const api = getServerApiClient();
  let orders: Order[] = [];
  try {
  const result = await api.orders.findAll({ limit: 50 });
  orders = result.data ?? [];
  } catch {
    orders = [];
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold">Order History</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        <Link href="/account/notifications" className="underline">
          Gestionar preferencias de notificaciones
        </Link>
      </p>

      {orders.length === 0 ? (
        <div className="mt-8 text-center">
          <p className="text-muted-foreground">You have not placed any orders yet.</p>
          <Link href="/store">
            <Button className="mt-4">Start shopping</Button>
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
