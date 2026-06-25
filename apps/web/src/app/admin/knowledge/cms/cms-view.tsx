'use client';

import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useApiClient, useApiQueryHooks, useAuthApiReady } from '@/lib/client-api';
import { AdminPageHeader } from '@/components/admin/admin-page-header';
import { AnimatedPageShell } from '@/components/motion/neo-page-transition';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { CmsPage } from '@repo/shared-types';

interface CmsViewProps {
  initialPages: CmsPage[];
}

export function CmsView({ initialPages }: CmsViewProps) {
  const api = useApiClient();
  const hooks = useApiQueryHooks();
  const authReady = useAuthApiReady();
  const [slug, setSlug] = React.useState('');
  const [title, setTitle] = React.useState('');
  const [bodyMarkdown, setBodyMarkdown] = React.useState('');
  const [isPublished, setIsPublished] = React.useState(false);

  const { data: pages } = useQuery({
    queryKey: ['ai', 'cms-pages', 'admin'],
    queryFn: () => api.ai.cmsPages.findAllAdmin(),
    initialData: initialPages,
    enabled: authReady,
  });

  const createMutation = hooks.useCreateCmsPage({
    onSuccess: () => {
      setSlug('');
      setTitle('');
      setBodyMarkdown('');
      setIsPublished(false);
    },
  });

  const updateMutation = hooks.useUpdateCmsPage();
  const deleteMutation = hooks.useDeleteCmsPage();

  function handleTogglePublished(page: CmsPage) {
    updateMutation.mutate({
      id: page.id,
      data: { isPublished: !page.isPublished },
    });
  }

  function handleDelete(id: string) {
    if (!window.confirm('¿Eliminar esta página CMS?')) {
      return;
    }
    deleteMutation.mutate(id);
  }

  function handleCreatePage(): void {
    if (!slug.trim() || !title.trim() || !bodyMarkdown.trim()) {
      return;
    }
    createMutation.mutate({
      slug: slug.trim(),
      title: title.trim(),
      bodyMarkdown: bodyMarkdown.trim(),
      isPublished,
    });
  }

  return (
    <AnimatedPageShell className="flex min-h-0 flex-1 flex-col gap-6">
      <AdminPageHeader
        title="CMS"
        subtitle="Conocimiento / Páginas de contenido"
        showNetworkStatus={false}
      />

      <div className="neo-panel grid gap-4 p-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="cms-slug">Slug</Label>
          <Input
            id="cms-slug"
            value={slug}
            onChange={(event) => setSlug(event.target.value)}
            placeholder="politica-privacidad"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="cms-title">Título</Label>
          <Input
            id="cms-title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            required
          />
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="cms-body">Contenido (Markdown)</Label>
          <Textarea
            id="cms-body"
            value={bodyMarkdown}
            onChange={(event) => setBodyMarkdown(event.target.value)}
            rows={6}
            required
          />
        </div>
        <div className="flex items-center gap-2">
          <Checkbox
            id="cms-published"
            checked={isPublished}
            onCheckedChange={(checked) => setIsPublished(checked === true)}
          />
          <Label htmlFor="cms-published" className="normal-case">
            Publicada
          </Label>
        </div>
        <div className="md:col-span-2">
          <Button type="button" disabled={createMutation.isPending} onClick={handleCreatePage}>
            {createMutation.isPending ? 'Guardando…' : 'Crear página'}
          </Button>
        </div>
      </div>

      <div className="neo-panel overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Slug</TableHead>
              <TableHead>Título</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(pages ?? []).map((page) => (
              <TableRow key={page.id}>
                <TableCell className="font-mono text-sm">{page.slug}</TableCell>
                <TableCell>{page.title}</TableCell>
                <TableCell>{page.isPublished ? 'Publicada' : 'Borrador'}</TableCell>
                <TableCell className="space-x-2 text-right">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => handleTogglePublished(page)}
                    disabled={updateMutation.isPending}
                  >
                    {page.isPublished ? 'Ocultar' : 'Publicar'}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDelete(page.id)}
                    disabled={deleteMutation.isPending}
                  >
                    Eliminar
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </AnimatedPageShell>
  );
}
