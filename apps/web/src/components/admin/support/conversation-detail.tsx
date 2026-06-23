'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { MessageBubble } from './message-bubble';
import { QuickReplyPicker } from './quick-reply-picker';
import { ConversationStatusBadge } from './conversation-status-badge';
import { formatDateTime } from '@repo/shared-utils';
import type { Conversation, ConversationStatus, Message, QuickReply } from '@repo/shared-types';

const STATUS_OPTIONS: { value: ConversationStatus; label: string }[] = [
  { value: 'OPEN', label: 'Abierto' },
  { value: 'PENDING', label: 'Pendiente' },
  { value: 'RESOLVED', label: 'Resuelto' },
  { value: 'CLOSED', label: 'Cerrado' },
];

interface ConversationDetailProps {
  conversation: Conversation;
  messages?: Message[];
  isLoadingMessages?: boolean;
  quickReplies?: QuickReply[];
  currentUserId?: string;
  onSendMessage: (content: string) => void | Promise<void>;
  onUpdateConversation: (data: { status?: ConversationStatus; assignedAgentId?: string }) => void | Promise<void>;
  isSending?: boolean;
  isUpdating?: boolean;
}

export function ConversationDetail({
  conversation,
  messages = [],
  isLoadingMessages,
  quickReplies = [],
  currentUserId,
  onSendMessage,
  onUpdateConversation,
  isSending,
  isUpdating,
}: ConversationDetailProps) {
  const [content, setContent] = React.useState('');
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = content.trim();
    if (!trimmed || isSending) return;
    await onSendMessage(trimmed);
    setContent('');
  }

  function handleQuickReply(text: string) {
    setContent((prev) => (prev ? `${prev}\n${text}` : text));
  }

  function handleAssignToMe() {
    if (currentUserId) {
      onUpdateConversation({ assignedAgentId: currentUserId });
    }
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-start justify-between border-b p-4">
        <div>
          <h2 className="text-lg font-semibold">
            {conversation.contactName || conversation.remoteJid}
          </h2>
          <p className="text-sm text-muted-foreground">
            {conversation.contactName ? conversation.remoteJid : `Cliente · ${formatDateTime(conversation.createdAt)}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            aria-label="Estado de la conversación"
            className="h-9 rounded-md border border-input bg-transparent px-3 py-2 text-sm"
            value={conversation.status}
            disabled={isUpdating}
            onChange={(e) => onUpdateConversation({ status: e.target.value as ConversationStatus })}
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isUpdating || conversation.assignedAgentId === currentUserId}
            onClick={handleAssignToMe}
          >
            Asignarme
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4">
        {isLoadingMessages ? (
          <div className="flex flex-col gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-2/3" />
            ))}
          </div>
        ) : messages.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            No hay mensajes aún. Envía una respuesta para iniciar la conversación.
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="border-t p-4">
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <QuickReplyPicker
              replies={quickReplies}
              onSelect={handleQuickReply}
              disabled={isSending}
            />
            <span className="text-xs text-muted-foreground">
              {content.length} caracteres
            </span>
          </div>
          <div className="flex items-end gap-2">
            <Textarea
              placeholder="Escribe una respuesta..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              disabled={isSending}
              rows={3}
              className="min-h-[80px] flex-1 resize-none"
            />
            <Button type="submit" disabled={isSending || !content.trim()}>
              {isSending ? 'Enviando...' : 'Enviar'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
