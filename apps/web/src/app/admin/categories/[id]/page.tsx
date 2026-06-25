import { notFound } from 'next/navigation';
import { getServerApiClient } from '@/lib/api';
import EditCategory from './edit-category';

interface EditCategoryPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditCategoryPage({ params }: EditCategoryPageProps) {
  const [{ id }, api] = await Promise.all([params, getServerApiClient()]);

  const categories = await api.categories.findOne(id).catch(() => null);
  if (!categories) {
    notFound();
  }
  return <EditCategory category={categories} />;
}
