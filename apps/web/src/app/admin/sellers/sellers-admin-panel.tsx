'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useApiClient } from '@/lib/client-api';
import type { Seller } from '@repo/shared-types';

interface SellersAdminPanelProps {
  initialSellers: Seller[];
}

export function SellersAdminPanel({ initialSellers }: SellersAdminPanelProps) {
  const api = useApiClient();
  const router = useRouter();
  const [sellers, setSellers] = useState(initialSellers);
  const [userId, setUserId] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [slug, setSlug] = useState('');
  const [pending, setPending] = useState(false);

  async function createSeller() {
    if (!userId.trim() || !businessName.trim() || !slug.trim()) return;
    setPending(true);
    try {
      await api.sellers.create({
        userId: userId.trim(),
        businessName: businessName.trim(),
        slug: slug.trim(),
      });
      const refreshed = await api.sellers.list();
      setSellers(refreshed);
      setUserId('');
      setBusinessName('');
      setSlug('');
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-2 sm:grid-cols-3">
        <Input value={userId} onChange={(e) => setUserId(e.target.value)} placeholder="User ID" />
        <Input value={businessName} onChange={(e) => setBusinessName(e.target.value)} placeholder="Nombre comercial" />
        <Input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="slug-tienda" />
      </div>
      <Button type="button" onClick={() => void createSeller()} disabled={pending}>
        Registrar vendedor
      </Button>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tienda</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Comisión</TableHead>
              <TableHead>Estado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sellers.map((seller) => (
              <TableRow key={seller.id}>
                <TableCell>{seller.businessName}</TableCell>
                <TableCell>{seller.slug}</TableCell>
                <TableCell>{seller.commissionRate}%</TableCell>
                <TableCell>
                  <Badge variant={seller.status === 'ACTIVE' ? 'default' : 'secondary'}>{seller.status}</Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
