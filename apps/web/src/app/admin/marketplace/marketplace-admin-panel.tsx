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
    <div className="space-y-6">
      <div className="rounded-md border p-4">
        <h2 className="mb-3 font-semibold">Canales configurados</h2>
        <ul className="space-y-2 text-sm">
          {initialChannels.map((channel) => (
            <li key={channel.id} className="flex items-center justify-between">
              <span>{channel.name}</span>
              <span className="text-muted-foreground text-xs">{channel.regions.join(', ')}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-md border">
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
            {initialListings.map((listing) => (
              <TableRow key={listing.id}>
                <TableCell>{listing.productId}</TableCell>
                <TableCell>{listing.channel}</TableCell>
                <TableCell>
                  <Badge>{listing.status}</Badge>
                </TableCell>
                <TableCell className="font-mono text-xs">
                  {listing.externalId ?? '—'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
