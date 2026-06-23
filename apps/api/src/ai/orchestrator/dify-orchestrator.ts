import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ConversationInboundContext,
  ConversationOrchestrator,
} from './conversation-orchestrator.interface.js';
import { NativeSupportBotOrchestrator } from './native-support-bot.orchestrator.js';

/**
 * Placeholder for Dify integration. Falls back to the native bot until
 * DIFY_API_URL and DIFY_API_KEY are configured and HTTP flows are wired.
 */
@Injectable()
export class DifyOrchestrator extends ConversationOrchestrator {
  private readonly logger = new Logger(DifyOrchestrator.name);

  constructor(
    private readonly config: ConfigService,
    private readonly nativeOrchestrator: NativeSupportBotOrchestrator,
  ) {
    super();
  }

  async handleInbound(context: ConversationInboundContext): Promise<void> {
    const apiUrl = this.config.get<string>('DIFY_API_URL');
    const apiKey = this.config.get<string>('DIFY_API_KEY');

    if (!apiUrl || !apiKey) {
      this.logger.debug('Dify not configured; delegating to native support bot');
      await this.nativeOrchestrator.handleInbound(context);
      return;
    }

    this.logger.warn('Dify adapter not fully implemented; delegating to native support bot');
    await this.nativeOrchestrator.handleInbound(context);
  }
}
