'use client';

import * as React from 'react';
import { Input } from '@/components/ui/input';
import { FormSelect } from '@/components/ui/form-select';
import { Button } from '@/components/ui/button';
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
  filter,
  onFilterChange,
  onSelect,
}: ConversationListProps) {
  return (
    <div className="flex h-full flex-col border-r-[3px] border-neo-onyx bg-neo-lace">
      <div className="flex flex-col gap-3 border-b-[3px] border-neo-onyx bg-white p-4">
        <Input
          placeholder="Buscar teléfono o nombre..."
          value={filter.search}
          onChange={(e) => onFilterChange({ search: e.target.value })}
        />
        <div className="flex items-center gap-2">
          <FormSelect
            ariaLabel="Filtrar por estado"
            value={filter.status}
            onValueChange={(value) =>
              onFilterChange({ status: value as ConversationStatus | '' })
            }
            placeholder="Todos"
            triggerClassName="h-9 flex-1"
            options={STATUS_OPTIONS.map((option) => ({
              value: option.value,
              label: option.label,
            }))}
          />
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
        {conversations.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            No hay conversaciones que coincidan con los filtros.
          </div>
        ) : (
          <ul className="flex flex-col">
            {conversations.map((conversation) => {
              const isSelected = conversation.id === selectedId;
              return (
                <li key={conversation.id}>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => onSelect(conversation)}
                    className={`h-auto w-full justify-start rounded-none border-b-[3px] border-neo-onyx px-4 py-4 text-left normal-case ${
                      isSelected ? 'bg-neo-gold' : 'hover:bg-neo-gold/40'
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
                  </Button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
