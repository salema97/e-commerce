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
import { useApiClient } from '@/lib/client-api';
import type { StoreLocation } from '@repo/shared-types';

interface PosAdminPanelProps {
  initialLocations: StoreLocation[];
}

export function PosAdminPanel({ initialLocations }: PosAdminPanelProps) {
  const api = useApiClient();
  const router = useRouter();
  const [locations, setLocations] = useState(initialLocations);
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [pending, setPending] = useState(false);

  async function createLocation() {
    if (!code.trim() || !name.trim() || !address.trim()) return;
    setPending(true);
    try {
      await api.pos.createLocation({
        code: code.trim(),
        name: name.trim(),
        address: address.trim(),
        supportsPickup: true,
        supportsPos: true,
      });
      const refreshed = await api.pos.listLocations();
      setLocations(refreshed);
      setCode('');
      setName('');
      setAddress('');
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-2 sm:grid-cols-3">
        <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="Código (ej. QUITO-01)" />
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nombre tienda" />
        <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Dirección" />
      </div>
      <Button type="button" onClick={() => void createLocation()} disabled={pending}>
        Crear ubicación
      </Button>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Código</TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead>Pickup</TableHead>
              <TableHead>POS</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {locations.map((location) => (
              <TableRow key={location.id}>
                <TableCell>{location.code}</TableCell>
                <TableCell>{location.name}</TableCell>
                <TableCell>{location.supportsPickup ? 'Sí' : 'No'}</TableCell>
                <TableCell>{location.supportsPos ? 'Sí' : 'No'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
