'use client';

import * as React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ConversationStatusBadge } from './conversation-status-badge';
import { formatRelativeDate } from '@repo/shared-utils';
import type { Conversation, ConversationStatus } from '@repo/shared-types';

const STATUS_OPTIONS: { value: ConversationStatus | ''; label: string }[] = [
  { value: '', label: 'Todos' },
  { value: 'OPEN', label: 'Abiertos' },
  { value: 'PENDING', label: 'Pendientes' },
  { value: 'RESOLVED', label: 'Resueltos' },
  { value: 'CLOSED', label: 'Cerrados' },
];

interface ConversationListProps {
  conversations: Conversation[];
  selectedId?: string | null;
  isLoading?: boolean;
  filter: {
    search: string;
    status: ConversationStatus | '';
    assignedToMe: boolean;
  };
  onFilterChange: (filter: Partial<ConversationListProps['filter']>) => void;
  onSelect: (conversation: Conversation) => void;
}

export function ConversationList({
  conversations,
  selectedId,
  isLoading,
  filter,
  onFilterChange,
  onSelect,
}: ConversationListProps) {
  return (
    <div className="flex h-full flex-col border-r bg-muted/30">
      <div className="flex flex-col gap-3 border-b p-4">
        <Input
          placeholder="Buscar teléfono o nombre..."
          value={filter.search}
          onChange={(e) => onFilterChange({ search: e.target.value })}
        />
        <div className="flex items-center gap-2">
          <select
            aria-label="Filtrar por estado"
            className="h-9 flex-1 rounded-md border border-input bg-transparent px-3 py-2 text-sm"
            value={filter.status}
            onChange={(e) => onFilterChange({ status: e.target.value as ConversationStatus | '' })}
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <Button
            type="button"
            variant={filter.assignedToMe ? 'default' : 'outline'}
            size="sm"
            onClick={() => onFilterChange({ assignedToMe: !filter.assignedToMe })}
          >
            Asignados a mí
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        {isLoading ? (
          <div className="flex flex-col gap-3 p-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : conversations.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            No hay conversaciones que coincidan con los filtros.
          </div>
        ) : (
          <ul className="flex flex-col">
            {conversations.map((conversation) => {
              const isSelected = conversation.id === selectedId;
              return (
                <li key={conversation.id}>
                  <button
                    type="button"
                    onClick={() => onSelect(conversation)}
                    className={`w-full border-b p-4 text-left transition-colors ${
                      isSelected
                        ? 'bg-primary/10'
                        : 'hover:bg-muted'
                    }`}
                    data-testid={`conversation-item-${conversation.id}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">
                          {conversation.contactName || conversation.remoteJid}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {conversation.contactName ? conversation.remoteJid : ''}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-[10px] text-muted-foreground">
                          {conversation.lastMessageAt
                            ? formatRelativeDate(conversation.lastMessageAt)
                            : formatRelativeDate(conversation.createdAt)}
                        </span>
                        {conversation.unreadCount > 0 ? (
                          <span className="flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-medium text-primary-foreground">
                            {conversation.unreadCount}
                          </span>
                        ) : null}
                      </div>
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <ConversationStatusBadge status={conversation.status} />
                      {conversation.assignedAgentId ? (
                        <span className="text-[10px] text-muted-foreground">
                          Asignado
                        </span>
                      ) : null}
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
