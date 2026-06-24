import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button-variants';
import { AnimatedPageShell } from '@/components/motion/neo-page-transition';
import { cn } from '@/lib/utils';
import { orderStatusLabel } from '@repo/shared-utils';
import type { OrderTracking } from '@repo/shared-types';

interface OrderTrackingViewProps {
  tracking: OrderTracking;
}

export function OrderTrackingView({ tracking }: OrderTrackingViewProps) {
  return (
    <AnimatedPageShell
      className="container mx-auto max-w-3xl px-4 py-10"
      header={
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Seguimiento del pedido</h1>
            <p className="mt-2 text-muted-foreground">{tracking.orderNumber}</p>
          </div>
          <Badge variant="outline">{orderStatusLabel(tracking.status)}</Badge>
        </div>
      }
    >
      <Card>
        <CardHeader>
          <CardTitle>Envíos</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {tracking.shipments.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Aún no hay envíos registrados para este pedido.
            </p>
          ) : (
            tracking.shipments.map((shipment) => (
              <div key={shipment.id} className="rounded-lg border p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-medium">{shipment.carrier}</p>
                    <p className="text-sm text-muted-foreground">
                      Guía: {shipment.trackingNumber ?? 'Pendiente'}
                    </p>
                  </div>
                  <Badge variant="secondary">{shipment.status}</Badge>
                </div>
                {shipment.trackingUrl ? (
                  <a
                    href={shipment.trackingUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 inline-block text-sm font-medium text-primary underline-offset-4 hover:underline"
                  >
                    Rastrear paquete
                  </a>
                ) : null}
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <div className="mt-8">
        <Link href="/store" className={cn(buttonVariants({ variant: 'outline' }))}>
          Volver a la tienda
        </Link>
      </div>
    </AnimatedPageShell>
  );
}
