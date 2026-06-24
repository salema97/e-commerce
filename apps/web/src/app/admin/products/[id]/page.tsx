import { notFound } from 'next/navigation';
import { getServerApiClient } from '@/lib/api';
import EditProduct from './edit-product';
import type { ProductContentDraft } from '@repo/shared-types';

interface EditProductPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditProductPage({ params }: EditProductPageProps) {
  const [{ id }, api] = await Promise.all([params, getServerApiClient()]);

  const [product, initialDraft] = await Promise.all([
    api.products.findOne(id).catch(() => null),
    api.ai.products.getDraft(id).catch((): ProductContentDraft | null => null),
  ]);

  if (!product) {
    notFound();
  }

  return <EditProduct product={product} initialDraft={initialDraft} />;
}
