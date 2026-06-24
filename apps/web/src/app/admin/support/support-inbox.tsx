'use client';

import * as React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useApiClient, useAuthApiReady } from '@/lib/client-api';
import { ConversationList } from '@/components/admin/support/conversation-list';
import { ConversationDetail } from '@/components/admin/support/conversation-detail';
import type { Conversation, ConversationStatus } from '@repo/shared-types';

interface SupportInboxProps {
  currentUserId: string;
}

export function SupportInbox({ currentUserId }: SupportInboxProps) {
  const api = useApiClient();
  const authReady = useAuthApiReady();
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [filters, setFilters] = React.useState<{
    search: string;
    status: ConversationStatus | '';
    assignedToMe: boolean;
  }>({
    search: '',
    status: '',
    assignedToMe: false,
  });

  const conversationsQuery = useQuery({
    queryKey: ['conversations', filters],
    queryFn: () => api.conversations.findAll({
      status: filters.status || undefined,
      assignedToMe: filters.assignedToMe ? 'true' : undefined,
      search: filters.search || undefined,
    }),
    enabled: authReady,
    refetchInterval: 10_000,
  });

  const selectedConversation = conversationsQuery.data?.data.find(
    (c) => c.id === selectedId,
  );

  const conversationDetailQuery = useQuery({
    queryKey: ['conversations', selectedId],
    queryFn: () => api.conversations.findOne(selectedId!),
    enabled: authReady && Boolean(selectedId),
    refetchInterval: 10_000,
  });

  const messagesQuery = useQuery({
    queryKey: ['conversations', selectedId, 'messages'],
    queryFn: () => api.messages.findAll(selectedId!),
    enabled: authReady && Boolean(selectedId),
    refetchInterval: 10_000,
  });

  const quickRepliesQuery = useQuery({
    queryKey: ['whatsapp', 'quick-replies'],
    queryFn: () => api.whatsapp.getQuickReplies(),
    enabled: authReady,
  });

  const createMessage = useMutation({
    mutationFn: ({ conversationId, content }: { conversationId: string; content: string }) =>
      api.messages.create(conversationId, { content }),
    onSuccess: (_, { conversationId }) => {
      queryClient.invalidateQueries({ queryKey: ['conversations', conversationId, 'messages'] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      queryClient.invalidateQueries({ queryKey: ['conversations', conversationId] });
    },
  });

  const updateConversation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: { status?: ConversationStatus; assignedAgentId?: string };
    }) => api.conversations.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      queryClient.invalidateQueries({ queryKey: ['conversations', id] });
    },
  });

  const activeConversation = conversationDetailQuery.data ?? selectedConversation;

  function handleSelect(conversation: Conversation) {
    setSelectedId(conversation.id);
  }

  async function handleSendMessage(content: string) {
    if (!selectedId) return;
    await createMessage.mutateAsync({ conversationId: selectedId, content });
  }

  async function handleUpdateConversation(data: {
    status?: ConversationStatus;
    assignedAgentId?: string;
  }) {
    if (!selectedId) return;
    await updateConversation.mutateAsync({ id: selectedId, data });
  }

  return (
    <div className="flex h-[calc(100vh-7rem)] flex-col gap-4">
      <h1 className="text-2xl font-bold">Bandeja de soporte</h1>
      {conversationsQuery.isError ? (
        <p className="text-sm text-destructive">
          No se pudieron cargar las conversaciones. Recarga la página o vuelve a iniciar sesión.
        </p>
      ) : null}
      <div className="grid flex-1 overflow-hidden rounded-lg border lg:grid-cols-[360px_1fr]">
        <ConversationList
          conversations={conversationsQuery.data?.data ?? []}
          selectedId={selectedId}
          isLoading={conversationsQuery.isLoading || !authReady}
          filter={filters}
          onFilterChange={(changes) => setFilters((prev) => ({ ...prev, ...changes }))}
          onSelect={handleSelect}
        />
        {activeConversation ? (
          <ConversationDetail
            conversation={activeConversation}
            messages={messagesQuery.data?.data ?? []}
            isLoadingMessages={messagesQuery.isLoading}
            quickReplies={quickRepliesQuery.data ?? []}
            currentUserId={currentUserId}
            onSendMessage={handleSendMessage}
            onUpdateConversation={handleUpdateConversation}
            isSending={createMessage.isPending}
            isUpdating={updateConversation.isPending}
          />
        ) : (
          <div className="flex items-center justify-center text-sm text-muted-foreground">
            Selecciona una conversación para ver los mensajes.
          </div>
        )}
      </div>
    </div>
  );
}
