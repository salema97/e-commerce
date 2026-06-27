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
import type { Faq } from '@repo/shared-types';

interface FaqsViewProps {
  initialFaqs: Faq[];
  canEdit: boolean;
}

export function FaqsView({ initialFaqs, canEdit }: FaqsViewProps) {
  const api = useApiClient();
  const hooks = useApiQueryHooks();
  const authReady = useAuthApiReady();
  const [question, setQuestion] = React.useState('');
  const [answer, setAnswer] = React.useState('');
  const [isPublished, setIsPublished] = React.useState(true);
  const [sortOrder, setSortOrder] = React.useState('0');

  const { data: faqs } = useQuery({
    queryKey: ['ai', 'faqs', 'admin'],
    queryFn: () => api.ai.faqs.findAllAdmin(),
    initialData: initialFaqs,
    enabled: authReady,
  });

  const createMutation = hooks.useCreateFaq({
    onSuccess: () => {
      setQuestion('');
      setAnswer('');
      setSortOrder('0');
      setIsPublished(true);
    },
  });

  const updateMutation = hooks.useUpdateFaq();
  const deleteMutation = hooks.useDeleteFaq();

  function handleTogglePublished(faq: Faq) {
    updateMutation.mutate({
      id: faq.id,
      data: { isPublished: !faq.isPublished },
    });
  }

  function handleDelete(id: string) {
    if (!window.confirm('¿Eliminar esta pregunta frecuente?')) {
      return;
    }
    deleteMutation.mutate(id);
  }

  function handleCreateFaq(): void {
    if (!question.trim() || !answer.trim()) {
      return;
    }
    createMutation.mutate({
      question: question.trim(),
      answer: answer.trim(),
      isPublished,
      sortOrder: Number(sortOrder) || 0,
    });
  }

  return (
    <AnimatedPageShell
      className="flex min-h-0 flex-1 flex-col gap-6"
      header={
        <AdminPageHeader
          title="FAQ"
          subtitle="Conocimiento / Preguntas frecuentes"
          showNetworkStatus={false}
        />
      }
    >
      {canEdit ? (
        <div className="neo-panel grid gap-4 p-4 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="faq-question">Pregunta</Label>
            <Input
              id="faq-question"
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              required
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="faq-answer">Respuesta</Label>
            <Textarea
              id="faq-answer"
              value={answer}
              onChange={(event) => setAnswer(event.target.value)}
              rows={4}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="faq-sort">Orden</Label>
            <Input
              id="faq-sort"
              type="number"
              value={sortOrder}
              onChange={(event) => setSortOrder(event.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 self-end">
            <Checkbox
              id="faq-published"
              checked={isPublished}
              onCheckedChange={(checked) => setIsPublished(checked === true)}
            />
            <Label htmlFor="faq-published" className="normal-case">
              Publicada
            </Label>
          </div>
          <div className="md:col-span-2">
            <Button type="button" disabled={createMutation.isPending} onClick={handleCreateFaq}>
              {createMutation.isPending ? 'Guardando…' : 'Agregar FAQ'}
            </Button>
          </div>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          Solo lectura: tu rol puede consultar las FAQ pero no editarlas.
        </p>
      )}

      <div className="neo-panel overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Orden</TableHead>
              <TableHead>Pregunta</TableHead>
              <TableHead>Estado</TableHead>
              {canEdit ? <TableHead className="text-right">Acciones</TableHead> : null}
            </TableRow>
          </TableHeader>
          <TableBody>
            {(faqs ?? []).map((faq) => (
              <TableRow key={faq.id}>
                <TableCell>{faq.sortOrder}</TableCell>
                <TableCell>
                  <p className="font-medium">{faq.question}</p>
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{faq.answer}</p>
                </TableCell>
                <TableCell>{faq.isPublished ? 'Publicada' : 'Borrador'}</TableCell>
                {canEdit ? (
                  <TableCell className="space-x-2 text-right">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => handleTogglePublished(faq)}
                      disabled={updateMutation.isPending}
                    >
                      {faq.isPublished ? 'Ocultar' : 'Publicar'}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDelete(faq.id)}
                      disabled={deleteMutation.isPending}
                    >
                      Eliminar
                    </Button>
                  </TableCell>
                ) : null}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </AnimatedPageShell>
  );
}
