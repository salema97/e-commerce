import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SupportInbox } from '@/app/admin/support/support-inbox';

const mockQueryOptions: Record<string, unknown>[] = [];

vi.mock('@tanstack/react-query', async () => {
  const actual = await vi.importActual<typeof import('@tanstack/react-query')>('@tanstack/react-query');
  return {
    ...actual,
    useQueryClient: () => ({
      invalidateQueries: vi.fn(),
    }),
    useQuery: vi.fn((options) => {
      mockQueryOptions.push(options);
      const queryKey = Array.isArray(options.queryKey) ? options.queryKey.join('/') : String(options.queryKey);

      if (queryKey.includes('quick-replies')) {
        return { data: [{ id: 'greeting', label: 'Saludo', text: 'Hola' }] };
      }

      if (queryKey.includes('messages')) {
        return { data: { data: [] }, isLoading: false };
      }

      if (queryKey === 'conversations') {
        return {
          data: {
            data: [
              {
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
              },
            ],
          },
          isLoading: false,
        };
      }

      return { data: undefined, isLoading: false };
    }),
    useMutation: vi.fn(() => ({
      mutateAsync: vi.fn(),
      isPending: false,
    })),
  };
});

vi.mock('@/lib/client-api', () => ({
  useAuthApiReady: () => true,
  useApiClient: () => ({
    conversations: {
      findAll: vi.fn().mockResolvedValue({ data: [], meta: { page: 1, limit: 20, total: 0, totalPages: 0 } }),
      findOne: vi.fn().mockResolvedValue({ id: 'c1' }),
      update: vi.fn().mockResolvedValue({ id: 'c1' }),
    },
    messages: {
      findAll: vi.fn().mockResolvedValue({ data: [], meta: { page: 1, limit: 20, total: 0, totalPages: 0 } }),
      create: vi.fn().mockResolvedValue({ id: 'm1' }),
    },
    whatsapp: {
      getQuickReplies: vi.fn().mockResolvedValue([{ id: 'greeting', label: 'Saludo', text: 'Hola' }]),
    },
  }),
}));

describe('SupportInbox polling', () => {
  const initialConversations = {
    data: [
      {
        id: 'c1',
        remoteJid: '+593991234567',
        instance: 'ecommerce',
        contactName: 'Juan Pérez',
        status: 'OPEN' as const,
        assignedAgentId: null,
        lastMessageAt: new Date().toISOString(),
        unreadCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ],
    meta: { page: 1, limit: 20, total: 1, totalPages: 1 },
  };

  beforeEach(() => {
    mockQueryOptions.length = 0;
  });

  it('configures polling for conversations, detail, and messages queries', () => {
    render(<SupportInbox currentUserId="u1" initialConversations={initialConversations} />);

    const pollConfigs = mockQueryOptions.filter(
      (options) => (options as { refetchInterval?: number }).refetchInterval === 10_000,
    );

    expect(pollConfigs.length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText('Soporte')).toBeInTheDocument();
  });

  it('passes filters to the conversations query function', () => {
    render(<SupportInbox currentUserId="u1" initialConversations={initialConversations} />);

    const conversationsQuery = mockQueryOptions.find(
      (options) =>
        Array.isArray((options as { queryKey?: unknown[] }).queryKey) &&
        (options as { queryKey: string[] }).queryKey[0] === 'conversations' &&
        (options as { queryKey: string[] }).queryKey.length === 2,
    );

    expect(conversationsQuery).toBeDefined();
  });
});
