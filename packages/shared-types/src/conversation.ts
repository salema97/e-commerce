import type {
  ConversationStatus,
  MessageContentType,
  MessageDirection,
  MessageStatus,
} from './enums.js';

export interface Message {
  id: string;
  conversationId: string;
  remoteJid: string;
  instance: string;
  direction: MessageDirection;
  senderType?: 'CUSTOMER' | 'AGENT' | 'BOT' | 'SYSTEM';
  contentType: MessageContentType;
  content: string;
  mediaUrl?: string | null;
  status: MessageStatus;
  externalMessageId?: string | null;
  externalStatus?: string | null;
  errorMessage?: string | null;
  sentAt?: string | null;
  deliveredAt?: string | null;
  readAt?: string | null;
  createdAt: string;
  updatedAt: string;
  conversation?: unknown;
}

export interface Conversation {
  id: string;
  userId?: string | null;
  remoteJid: string;
  instance: string;
  contactName?: string | null;
  status: ConversationStatus;
  assignedAgentId?: string | null;
  lastMessageAt?: string | null;
  unreadCount: number;
  createdAt: string;
  updatedAt: string;
  user?: unknown;
  messages?: Message[];
}

export interface SendMessageDto {
  conversationId: string;
  content: string;
}

export interface UpdateConversationDto {
  status?: ConversationStatus;
  assignedAgentId?: string;
}

export interface ConversationTemplate {
  id: string;
  name: string;
  content: string;
  source: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface QuickReply {
  id: string;
  label: string;
  text: string;
}

export interface PaginatedConversations {
  data: Conversation[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface PaginatedMessages {
  data: Message[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
