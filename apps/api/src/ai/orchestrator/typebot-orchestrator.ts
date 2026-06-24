import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ConversationInboundContext,
  ConversationOrchestrator,
} from './conversation-orchestrator.interface.js';
import { NativeSupportBotOrchestrator } from './native-support-bot.orchestrator.js';

/**
 * Placeholder for Typebot integration. Falls back to native bot until configured.
 */
@Injectable()
export class TypebotOrchestrator extends ConversationOrchestrator {
  private readonly logger = new Logger(TypebotOrchestrator.name);

  constructor(
    private readonly config: ConfigService,
    private readonly nativeOrchestrator: NativeSupportBotOrchestrator,
  ) {
    super();
  }

  async handleInbound(context: ConversationInboundContext): Promise<void> {
    const apiUrl = this.config.get<string>('TYPEBOT_API_URL');

    if (!apiUrl) {
      this.logger.debug('Typebot not configured; delegating to native support bot');
      await this.nativeOrchestrator.handleInbound(context);
      return;
    }

    this.logger.warn('Typebot adapter not fully implemented; delegating to native support bot');
    await this.nativeOrchestrator.handleInbound(context);
  }
}
