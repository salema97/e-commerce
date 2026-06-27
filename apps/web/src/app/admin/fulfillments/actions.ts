'use server';

import { revalidatePath } from 'next/cache';
import { inventoryRoles } from '@/lib/auth';
import { getServerApiClient } from '@/lib/api';
import { requireServerRoles } from '@/lib/server-action-auth';

export async function markShipmentDelivered(shipmentId: string): Promise<void> {
  await requireServerRoles(inventoryRoles, '/sign-in?redirect_url=/admin/fulfillments');
  const api = await getServerApiClient();
  await api.fulfillment.markDelivered(shipmentId);
  revalidatePath('/admin/fulfillments');
}
