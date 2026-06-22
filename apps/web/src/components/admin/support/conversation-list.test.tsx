import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ConversationList } from './conversation-list';
import type { Conversation } from '@repo/shared-types';

function makeConversation(overrides?: Partial<Conversation>): Conversation {
  return {
    id: 'c1',
    remoteJid: '+593991234567',
    instance: 'ecommerce',
    contactName: 'Juan Pérez',
    status: 'OPEN',
    assignedAgentId: null,
    lastMessageAt: new Date().toISOString(),
    unreadCount: 2,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

describe('ConversationList', () => {
  it('renders conversation items with status badge and unread count', () => {
    const conversations = [makeConversation()];
    render(
      <ConversationList
        conversations={conversations}
        filter={{ search: '', status: '', assignedToMe: false }}
        onFilterChange={vi.fn()}
        onSelect={vi.fn()}
      />,
    );

    expect(screen.getByText('Juan Pérez')).toBeInTheDocument();
    expect(screen.getByText('+593991234567')).toBeInTheDocument();
    expect(screen.getByText('Abierto')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('calls onSelect when a conversation is clicked', () => {
    const conversations = [makeConversation()];
    const onSelect = vi.fn();
    render(
      <ConversationList
        conversations={conversations}
        filter={{ search: '', status: '', assignedToMe: false }}
        onFilterChange={vi.fn()}
        onSelect={onSelect}
      />,
    );

    fireEvent.click(screen.getByTestId('conversation-item-c1'));
    expect(onSelect).toHaveBeenCalledWith(conversations[0]);
  });

  it('renders empty state when no conversations', () => {
    render(
      <ConversationList
        conversations={[]}
        filter={{ search: '', status: '', assignedToMe: false }}
        onFilterChange={vi.fn()}
        onSelect={vi.fn()}
      />,
    );

    expect(screen.getByText(/No hay conversaciones/i)).toBeInTheDocument();
  });

  it('toggles assigned-to-me filter', () => {
    const onFilterChange = vi.fn();
    render(
      <ConversationList
        conversations={[]}
        filter={{ search: '', status: '', assignedToMe: false }}
        onFilterChange={onFilterChange}
        onSelect={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /Asignados a mí/i }));
    expect(onFilterChange).toHaveBeenCalledWith({ assignedToMe: true });
  });
});
