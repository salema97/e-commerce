'use server';

import { revalidatePath } from 'next/cache';
import { inventoryRoles } from '@/lib/auth';
import { getServerApiClient } from '@/lib/api';
import { requireServerRoles } from '@/lib/server-action-auth';

export async function markShipmentDelivered(shipmentId: string): Promise<void> {
  const [, api] = await Promise.all([
    requireServerRoles(inventoryRoles, '/sign-in?redirect_url=/admin/fulfillments'),
    getServerApiClient(),
  ]);
  await api.fulfillment.markDelivered(shipmentId);
  revalidatePath('/admin/fulfillments');
}
