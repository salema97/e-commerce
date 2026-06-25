import { notFound } from 'next/navigation';
import { getServerApiClient } from '@/lib/api';
import EditInventory from './edit-inventory';

interface EditInventoryPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditInventoryPage({ params }: EditInventoryPageProps) {
  const [{ id }, api] = await Promise.all([params, getServerApiClient()]);
  const item = await api.inventory.findOne(id).catch(() => null);

  if (!item) {
    notFound();
  }

  return <EditInventory item={item} />;
}
