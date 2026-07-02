import { describe, it, expect, vi } from 'vitest';
import { NativeSupportBotOrchestrator } from './native-support-bot.orchestrator.js';

describe('ConversationOrchestrator', () => {
  it('native orchestrator delegates to support bot for WhatsApp', async () => {
    const supportBot = {
      handleInboundWhatsApp: vi.fn().mockResolvedValue(undefined),
      handleInboundWeb: vi.fn(),
    };
    const orchestrator = new NativeSupportBotOrchestrator(supportBot as never);

    await orchestrator.handleInbound({
      conversationId: 'c1',
      channel: 'WHATSAPP',
      content: 'Hola',
      phoneDigits: '593991234567',
    });

    expect(supportBot.handleInboundWhatsApp).toHaveBeenCalledWith('c1', 'Hola', '593991234567');
  });
});
