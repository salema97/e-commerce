'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { AdminPageHeader } from '@/components/admin/admin-page-header';
import { AdminSectionTitle } from '@/components/admin/admin-section-title';
import { AnimatedPageShell } from '@/components/motion/neo-page-transition';
import type { MarketplaceChannelProfile, MarketplaceListing } from '@repo/shared-types';

interface MarketplaceAdminPanelProps {
  initialChannels: MarketplaceChannelProfile[];
  initialListings: MarketplaceListing[];
}

export function MarketplaceAdminPanel({
  initialChannels,
  initialListings,
}: MarketplaceAdminPanelProps) {
  return (
    <AnimatedPageShell
      className="flex min-h-0 flex-1 flex-col gap-6"
      header={
        <AdminPageHeader
          eyebrow="Ventas"
          title="Marketplace"
          subtitle="Sincroniza catálogo e importa pedidos de canales externos."
          metrics={[
            { label: 'Canales', value: String(initialChannels.length) },
            { label: 'Listados', value: String(initialListings.length) },
          ]}
        />
      }
    >
      <div className="flex flex-col gap-10">
        <section className="flex flex-col gap-4">
          <AdminSectionTitle>Canales configurados</AdminSectionTitle>
          {initialChannels.length === 0 ? (
            <p className="text-sm font-bold uppercase text-muted-foreground">
              No hay canales configurados.
            </p>
          ) : (
            <ul className="neo-panel divide-y divide-neo-onyx/15">
              {initialChannels.map((channel) => (
                <li
                  key={channel.id}
                  className="flex flex-wrap items-center justify-between gap-2 p-4 text-sm font-bold uppercase"
                >
                  <span>{channel.name}</span>
                  <span className="text-xs font-medium normal-case text-muted-foreground">
                    {channel.regions.join(', ')}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="flex flex-col gap-4">
          <AdminSectionTitle>Listados por canal</AdminSectionTitle>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Producto</TableHead>
                <TableHead>Canal</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>ID externo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {initialListings.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-muted-foreground">
                    No hay listados sincronizados.
                  </TableCell>
                </TableRow>
              ) : (
                initialListings.map((listing) => (
                  <TableRow key={listing.id}>
                    <TableCell className="font-medium">{listing.productId}</TableCell>
                    <TableCell>{listing.channel}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{listing.status}</Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {listing.externalId ?? '—'}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </section>
      </div>
    </AnimatedPageShell>
  );
}
