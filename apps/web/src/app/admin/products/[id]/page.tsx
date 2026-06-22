import { notFound } from 'next/navigation';
import { getServerApiClient } from '@/lib/api';
import EditProduct from './edit-product';

interface EditProductPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditProductPage({ params }: EditProductPageProps) {
  const { id } = await params;
  const api = getServerApiClient();

  try {
    const product = await api.products.findOne(id);
    return <EditProduct product={product} />;
  } catch {
    notFound();
  }
}
