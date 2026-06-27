import Link from 'next/link';
import { getServerApiClient } from '@/lib/api';
import { AdminPageHeader } from '@/components/admin/admin-page-header';
import { AnimatedPageShell } from '@/components/motion/neo-page-transition';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { FulfillmentsActions } from './fulfillments-actions';

export default async function AdminFulfillmentsPage() {
  const api = await getServerApiClient();
  const [shipments, backorders] = await Promise.all([
    api.fulfillment.listAllShipments({ limit: 100 }).catch(() => []),
    api.fulfillment.listBackorders().catch(() => []),
  ]);

  return (
    <AnimatedPageShell
      className="flex min-h-0 flex-1 flex-col gap-8"
      header={
        <AdminPageHeader
          title="Envíos"
          subtitle="Envíos globales y líneas en backorder"
          showNetworkStatus={false}
        />
      }
    >
      <section className="space-y-4">
        <h2 className="font-anton text-2xl uppercase">Envíos recientes</h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Pedido</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Transportista</TableHead>
              <TableHead>Seguimiento</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {shipments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-muted-foreground">
                  No hay envíos registrados.
                </TableCell>
              </TableRow>
            ) : (
              shipments.map((shipment) => (
                <TableRow key={shipment.id}>
                  <TableCell className="font-medium">{shipment.orderNumber}</TableCell>
                  <TableCell>{shipment.customerEmail}</TableCell>
                  <TableCell>{shipment.carrier}</TableCell>
                  <TableCell>{shipment.trackingNumber ?? '—'}</TableCell>
                  <TableCell>{shipment.status}</TableCell>
                  <TableCell className="text-right">
                    <FulfillmentsActions shipmentId={shipment.id} orderId={shipment.orderId} />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </section>

      <section className="space-y-4">
        <h2 className="font-anton text-2xl uppercase">Backorders abiertos</h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Pedido</TableHead>
              <TableHead>Producto</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead>Cantidad pendiente</TableHead>
              <TableHead className="text-right">Pedido</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {backorders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-muted-foreground">
                  No hay backorders abiertos.
                </TableCell>
              </TableRow>
            ) : (
              backorders.map((line) => (
                <TableRow key={line.id}>
                  <TableCell className="font-medium">{line.order.orderNumber}</TableCell>
                  <TableCell>{line.product.name}</TableCell>
                  <TableCell>{line.product.sku ?? '—'}</TableCell>
                  <TableCell>{line.quantityBackordered || line.quantity}</TableCell>
                  <TableCell className="text-right">
                    <Link href={`/admin/orders/${line.order.id}`}>
                      <Button variant="outline" size="sm" className="font-anton uppercase">
                        Ver pedido
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </section>
    </AnimatedPageShell>
  );
}
