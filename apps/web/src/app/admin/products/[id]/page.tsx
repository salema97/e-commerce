import { notFound } from 'next/navigation';
import { getServerApiClient } from '@/lib/api';
import EditProduct from './edit-product';
import type { ProductContentDraft } from '@repo/shared-types';

interface EditProductPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditProductPage({ params }: EditProductPageProps) {
  const { id } = await params;
  const api = await getServerApiClient();

  try {
    const [product, initialDraft] = await Promise.all([
      api.products.findOne(id),
      api.ai.products.getDraft(id).catch((): ProductContentDraft | null => null),
    ]);
    return <EditProduct product={product} initialDraft={initialDraft} />;
  } catch {
    notFound();
  }
}
