'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useApiClient } from '@/lib/client-api';
import { formatPrice } from '@repo/shared-utils';
import type { Product, ProductStatus } from '@repo/shared-types';

export default function EditProductPage({ product }: { product: Product }) {
  const router = useRouter();
  const api = useApiClient();
  const { getToken } = useAuth();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [draft, setDraft] = React.useState<{
    description?: string;
    metaTitle?: string;
    metaDescription?: string;
    status?: string;
  } | null>(null);

  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3001/v1';

  async function authHeaders(): Promise<HeadersInit> {
    const token = await getToken();
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  }

  async function handleGenerateContent() {
    setIsGenerating(true);
    try {
      const response = await fetch(`${apiBase}/ai/products/${product.id}/generate-content`, {
        method: 'POST',
        headers: await authHeaders(),
      });
      if (response.ok) {
        const data = await response.json();
        setDraft(data);
      }
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleApproveDraft() {
    const response = await fetch(`${apiBase}/ai/products/${product.id}/content-draft/approve`, {
      method: 'POST',
      headers: await authHeaders(),
    });
    if (response.ok) {
      router.refresh();
      setDraft(null);
    }
  }

  async function handleRejectDraft() {
    await fetch(`${apiBase}/ai/products/${product.id}/content-draft/reject`, {
      method: 'POST',
      headers: await authHeaders(),
    });
    setDraft(null);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    try {
      await api.products.update(product.id, {
        name: String(formData.get('name')),
        slug: String(formData.get('slug')),
        description: String(formData.get('description')),
        sku: String(formData.get('sku')),
        status: String(formData.get('status')) as ProductStatus,
        price: Number(formData.get('price')),
        compareAtPrice: Number(formData.get('compareAtPrice')) || undefined,
        cost: Number(formData.get('cost')) || undefined,
        isFeatured: formData.get('isFeatured') === 'on',
      });
      router.push('/admin/products');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">Edit Product</h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <Card>
          <CardHeader>
            <CardTitle>{product.name}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" name="name" defaultValue={product.name} required />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="slug">Slug</Label>
              <Input id="slug" name="slug" defaultValue={product.slug} required />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                defaultValue={product.description ?? ''}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="sku">SKU</Label>
              <Input id="sku" name="sku" defaultValue={product.sku ?? ''} />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="status">Status</Label>
              <Select id="status" name="status" defaultValue={product.status}>
                <option value="DRAFT">Draft</option>
                <option value="ACTIVE">Active</option>
                <option value="ARCHIVED">Archived</option>
              </Select>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="price">Price</Label>
                <Input
                  id="price"
                  name="price"
                  type="number"
                  step="0.01"
                  defaultValue={product.price}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="compareAtPrice">Compare at price</Label>
                <Input
                  id="compareAtPrice"
                  name="compareAtPrice"
                  type="number"
                  step="0.01"
                  defaultValue={product.compareAtPrice ?? ''}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="cost">Cost</Label>
                <Input
                  id="cost"
                  name="cost"
                  type="number"
                  step="0.01"
                  defaultValue={product.cost ?? ''}
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                id="isFeatured"
                name="isFeatured"
                type="checkbox"
                defaultChecked={product.isFeatured}
              />
              <Label htmlFor="isFeatured">Featured product</Label>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Contenido con IA</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Button type="button" variant="secondary" disabled={isGenerating} onClick={() => void handleGenerateContent()}>
              {isGenerating ? 'Generando...' : 'Generar con IA'}
            </Button>
            {draft ? (
              <div className="rounded-md border p-4 text-sm">
                <p className="font-medium">Borrador pendiente ({draft.status ?? 'PENDING'})</p>
                {draft.metaTitle ? <p className="mt-2"><strong>Meta título:</strong> {draft.metaTitle}</p> : null}
                {draft.metaDescription ? <p className="mt-1"><strong>Meta descripción:</strong> {draft.metaDescription}</p> : null}
                {draft.description ? <p className="mt-1 whitespace-pre-wrap"><strong>Descripción:</strong> {draft.description}</p> : null}
                <div className="mt-3 flex gap-2">
                  <Button type="button" size="sm" onClick={() => void handleApproveDraft()}>
                    Aprobar y publicar
                  </Button>
                  <Button type="button" size="sm" variant="outline" onClick={() => void handleRejectDraft()}>
                    Rechazar
                  </Button>
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <div className="flex gap-4">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Save changes'}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
