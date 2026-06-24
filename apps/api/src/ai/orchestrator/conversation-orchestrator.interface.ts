export interface ConversationInboundContext {
  conversationId: string;
  channel: 'WHATSAPP' | 'WEB';
  content: string;
  phoneDigits?: string;
}

export abstract class ConversationOrchestrator {
  abstract handleInbound(context: ConversationInboundContext): Promise<void>;
}
