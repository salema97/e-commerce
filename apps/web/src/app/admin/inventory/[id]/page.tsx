import { notFound } from 'next/navigation';
import { getServerApiClient } from '@/lib/api';
import EditInventory from './edit-inventory';

interface EditInventoryPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditInventoryPage({ params }: EditInventoryPageProps) {
  const { id } = await params;
  const api = getServerApiClient();

  try {
    const item = await api.inventory.findOne(id);
    return <EditInventory item={item} />;
  } catch {
    notFound();
  }
}
