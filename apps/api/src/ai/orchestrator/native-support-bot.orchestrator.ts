import { Injectable } from '@nestjs/common';
import { SupportBotService } from '../support-bot/support-bot.service.js';
import {
  ConversationInboundContext,
  ConversationOrchestrator,
} from './conversation-orchestrator.interface.js';

@Injectable()
export class NativeSupportBotOrchestrator extends ConversationOrchestrator {
  constructor(private readonly supportBot: SupportBotService) {
    super();
  }

  async handleInbound(context: ConversationInboundContext): Promise<void> {
    if (context.channel === 'WEB') {
      await this.supportBot.handleInboundWeb(context.conversationId, context.content);
      return;
    }

    await this.supportBot.handleInboundWhatsApp(
      context.conversationId,
      context.content,
      context.phoneDigits ?? '',
    );
  }
}
