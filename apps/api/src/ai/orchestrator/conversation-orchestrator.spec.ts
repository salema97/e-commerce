import { describe, it, expect, vi } from 'vitest';
import { ConfigService } from '@nestjs/config';
import { NativeSupportBotOrchestrator } from './native-support-bot.orchestrator.js';
import { DifyOrchestrator } from './dify-orchestrator.js';

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

  it('dify orchestrator falls back to native when not configured', async () => {
    const native = { handleInbound: vi.fn().mockResolvedValue(undefined) };
    const config = { get: () => undefined } as unknown as ConfigService;
    const orchestrator = new DifyOrchestrator(config, native as never);

    await orchestrator.handleInbound({
      conversationId: 'c1',
      channel: 'WEB',
      content: 'Hola',
    });

    expect(native.handleInbound).toHaveBeenCalled();
  });
});
