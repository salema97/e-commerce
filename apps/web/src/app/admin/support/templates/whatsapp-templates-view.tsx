'use client';

import * as React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useApiClient, useAuthApiReady } from '@/lib/client-api';
import { AdminPageHeader } from '@/components/admin/admin-page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { QuickReply } from '@repo/shared-types';

export function WhatsAppTemplatesView({
  initialTemplates,
}: {
  initialTemplates: QuickReply[];
}) {
  const api = useApiClient();
  const authReady = useAuthApiReady();
  const queryClient = useQueryClient();
  const [label, setLabel] = React.useState('');
  const [text, setText] = React.useState('');

  const { data: templates } = useQuery({
    queryKey: ['whatsapp', 'quick-replies', 'admin'],
    queryFn: () => api.whatsapp.listQuickRepliesAdmin(),
    initialData: initialTemplates,
    enabled: authReady,
  });

  const createMutation = useMutation({
    mutationFn: () => api.whatsapp.createQuickReply({ label: label.trim(), text: text.trim() }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['whatsapp'] });
      setLabel('');
      setText('');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.whatsapp.deleteQuickReply(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['whatsapp'] });
    },
  });

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-6">
      <AdminPageHeader
        title="Plantillas WhatsApp"
        subtitle="Respuestas rápidas para la bandeja de soporte"
        showNetworkStatus={false}
      />

      <form
        className="neo-panel grid gap-4 p-4"
        onSubmit={(event) => {
          event.preventDefault();
          if (!label.trim() || !text.trim()) return;
          void createMutation.mutateAsync();
        }}
      >
        <div className="space-y-2">
          <Label htmlFor="label">Etiqueta</Label>
          <Input id="label" value={label} onChange={(e) => setLabel(e.target.value)} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="text">Texto</Label>
          <Textarea id="text" value={text} onChange={(e) => setText(e.target.value)} rows={4} required />
        </div>
        <Button type="submit" disabled={createMutation.isPending}>
          {createMutation.isPending ? 'Guardando...' : 'Agregar plantilla'}
        </Button>
      </form>

      <ul className="neo-panel divide-y divide-neo-onyx/15">
        {(templates ?? []).map((template) => (
          <li key={template.id} className="flex items-start justify-between gap-4 p-4">
            <div>
              <p className="font-semibold">{template.label}</p>
              <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">{template.text}</p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={deleteMutation.isPending}
              onClick={() => void deleteMutation.mutateAsync(template.id)}
            >
              Eliminar
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}
