import { notFound } from 'next/navigation';
import { getServerApiClient } from '@/lib/api';
import EditCategory from './edit-category';

interface EditCategoryPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditCategoryPage({ params }: EditCategoryPageProps) {
  const { id } = await params;
  const api = getServerApiClient();

  try {
    const category = await api.categories.findOne(id);
    return <EditCategory category={category} />;
  } catch {
    notFound();
  }
}
