'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { FormSelect } from '@/components/ui/form-select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { AnimatedPageShell } from '@/components/motion/neo-page-transition';
import { useApiClient, useApiQueryHooks } from '@/lib/client-api';
import type { Product, ProductStatus } from '@repo/shared-types';

export default function EditProductPage({ product }: { product: Product }) {
  const router = useRouter();
  const api = useApiClient();
  const hooks = useApiQueryHooks();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const { data: draft, refetch: refetchDraft } = hooks.useProductContentDraft(product.id);
  const generateContent = hooks.useGenerateProductContent({
    onSuccess: () => void refetchDraft(),
  });
  const approveDraft = hooks.useApproveProductContent({
    onSuccess: () => {
      router.refresh();
      void refetchDraft();
    },
  });
  const rejectDraft = hooks.useRejectProductContent({
    onSuccess: () => void refetchDraft(),
  });

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
    <AnimatedPageShell
      className="flex flex-col gap-6"
      header={<h1 className="text-2xl font-bold">Editar producto</h1>}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <Card>
          <CardHeader>
            <CardTitle>{product.name}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nombre</Label>
              <Input id="name" name="name" defaultValue={product.name} required />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="slug">URL amigable</Label>
              <Input id="slug" name="slug" defaultValue={product.slug} required />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Descripción</Label>
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
              <Label htmlFor="status">Estado</Label>
              <FormSelect
                id="status"
                name="status"
                defaultValue={product.status}
                options={[
                  { value: 'DRAFT', label: 'Borrador' },
                  { value: 'ACTIVE', label: 'Activo' },
                  { value: 'ARCHIVED', label: 'Archivado' },
                ]}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="price">Precio</Label>
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
                <Label htmlFor="compareAtPrice">Precio de comparación</Label>
                <Input
                  id="compareAtPrice"
                  name="compareAtPrice"
                  type="number"
                  step="0.01"
                  defaultValue={product.compareAtPrice ?? ''}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="cost">Costo</Label>
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
              <Checkbox
                id="isFeatured"
                name="isFeatured"
                defaultChecked={product.isFeatured}
              />
              <Label htmlFor="isFeatured" className="normal-case">Producto destacado</Label>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Contenido con IA</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Button
              type="button"
              variant="secondary"
              disabled={generateContent.isPending}
              onClick={() => generateContent.mutate(product.id)}
            >
              {generateContent.isPending ? 'Generando...' : 'Generar con IA'}
            </Button>
            {draft ? (
              <div className="rounded-md border p-4 text-sm">
                <p className="font-medium">Borrador pendiente de revisión</p>
                {draft.metaTitle ? <p className="mt-2"><strong>Meta título:</strong> {draft.metaTitle}</p> : null}
                {draft.metaDescription ? <p className="mt-1"><strong>Meta descripción:</strong> {draft.metaDescription}</p> : null}
                {draft.description ? <p className="mt-1 whitespace-pre-wrap"><strong>Descripción:</strong> {draft.description}</p> : null}
                <div className="mt-3 flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    disabled={approveDraft.isPending}
                    onClick={() => approveDraft.mutate(product.id)}
                  >
                    Aprobar y publicar
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={rejectDraft.isPending}
                    onClick={() => rejectDraft.mutate(product.id)}
                  >
                    Rechazar
                  </Button>
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <div className="flex gap-4">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Guardando…' : 'Guardar cambios'}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancelar
          </Button>
        </div>
      </form>
    </AnimatedPageShell>
  );
}
