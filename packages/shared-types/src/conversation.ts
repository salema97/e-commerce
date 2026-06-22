import type { ConversationStatus, MessageDirection, MessageStatus } from './enums.js';

export interface Message {
  id: string;
  conversationId: string;
  direction: MessageDirection;
  content: string;
  mediaUrl?: string | null;
  status?: MessageStatus | null;
  senderType?: string | null;
  createdAt: string;
  conversation?: unknown;
}

export interface Conversation {
  id: string;
  userId?: string | null;
  customerPhone: string;
  customerName?: string | null;
  status: ConversationStatus;
  assignedAgentId?: string | null;
  source: string;
  createdAt: string;
  updatedAt: string;
  user?: unknown;
  messages?: Message[];
}

export interface SendMessageDto {
  conversationId: string;
  content: string;
  mediaUrl?: string;
}

export interface UpdateConversationDto {
  status?: ConversationStatus;
  assignedAgentId?: string;
  customerName?: string;
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
