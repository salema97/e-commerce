import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ConversationDetail } from './conversation-detail';
import type { Conversation, Message } from '@repo/shared-types';

function makeConversation(overrides?: Partial<Conversation>): Conversation {
  return {
    id: 'c1',
    remoteJid: '+593991234567',
    instance: 'ecommerce',
    contactName: 'Juan Pérez',
    status: 'OPEN',
    assignedAgentId: null,
    lastMessageAt: new Date().toISOString(),
    unreadCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

function makeMessage(overrides?: Partial<Message>): Message {
  return {
    id: 'm1',
    conversationId: 'c1',
    remoteJid: '+593991234567',
    instance: 'ecommerce',
    direction: 'INBOUND',
    contentType: 'TEXT',
    content: 'Hola',
    status: 'SENT',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

describe('ConversationDetail', () => {
  it('renders conversation header and messages', () => {
    render(
      <ConversationDetail
        conversation={makeConversation()}
        messages={[makeMessage(), makeMessage({ id: 'm2', direction: 'OUTBOUND', content: 'Buenos días' })]}
        quickReplies={[{ id: 'greeting', label: 'Saludo', text: 'Hola, ¿cómo estás?' }]}
        currentUserId="u1"
        onSendMessage={vi.fn()}
        onUpdateConversation={vi.fn()}
      />,
    );

    expect(screen.getByText('Juan Pérez')).toBeInTheDocument();
    expect(screen.getByText('Hola')).toBeInTheDocument();
    expect(screen.getByText('Buenos días')).toBeInTheDocument();
  });

  it('submits a new message', async () => {
    const onSendMessage = vi.fn();
    render(
      <ConversationDetail
        conversation={makeConversation()}
        messages={[]}
        quickReplies={[]}
        currentUserId="u1"
        onSendMessage={onSendMessage}
        onUpdateConversation={vi.fn()}
      />,
    );

    const textarea = screen.getByPlaceholderText(/Escribe una respuesta/i);
    fireEvent.change(textarea, { target: { value: 'Gracias por contactarnos' } });
    fireEvent.click(screen.getByRole('button', { name: /Enviar/i }));

    expect(onSendMessage).toHaveBeenCalledWith('Gracias por contactarnos');
  });

  it('assigns conversation to current user', () => {
    const onUpdateConversation = vi.fn();
    render(
      <ConversationDetail
        conversation={makeConversation()}
        messages={[]}
        quickReplies={[]}
        currentUserId="u1"
        onSendMessage={vi.fn()}
        onUpdateConversation={onUpdateConversation}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /Asignarme/i }));
    expect(onUpdateConversation).toHaveBeenCalledWith({ assignedAgentId: 'u1' });
  });
});
