import { createHash } from 'node:crypto';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service.js';
import { ConversationService } from '../../conversations/conversation.service.js';
import { MessageService } from '../../messages/message.service.js';
import { LlmProvider } from '../llm/llm-provider.interface.js';
import { LlmGuardrailsService } from '../llm/llm-guardrails.service.js';
import { RagService } from '../rag/rag.service.js';
import { OrderLookupTool } from './order-lookup.tool.js';

const ESCALATION_KEYWORDS = ['agente', 'humano', 'persona', 'operador'];

@Injectable()
export class SupportBotService {
  private readonly logger = new Logger(SupportBotService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly llmProvider: LlmProvider,
    private readonly guardrails: LlmGuardrailsService,
    private readonly ragService: RagService,
    private readonly orderLookup: OrderLookupTool,
    private readonly conversationService: ConversationService,
    private readonly messageService: MessageService,
  ) {}

  async handleInboundWhatsApp(
    conversationId: string,
    content: string,
    phoneDigits: string,
  ): Promise<void> {
    if (this.config.get<string>('SUPPORT_BOT_ENABLED') !== 'true') {
      return;
    }

    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { user: { select: { whatsappOptOut: true } } },
    });

    if (!conversation?.botEnabled || conversation.channel !== 'WHATSAPP') {
      return;
    }

    if (conversation.user?.whatsappOptOut) {
      return;
    }

    await this.processInbound(conversationId, content, phoneDigits);
  }

  async handleInboundWeb(conversationId: string, content: string): Promise<void> {
    if (this.config.get<string>('SUPPORT_BOT_ENABLED') !== 'true') {
      return;
    }

    const conversation = await this.prisma.conversation.findUnique({ where: { id: conversationId } });
    if (!conversation?.botEnabled || conversation.channel !== 'WEB') {
      return;
    }

    await this.processInbound(conversationId, content, '');
  }

  private async processInbound(
    conversationId: string,
    content: string,
    phoneDigits: string,
  ): Promise<void> {
    const normalized = content.trim().toLowerCase();
    if (this.shouldEscalateByKeyword(normalized)) {
      await this.escalate(conversationId, 0.1, []);
      return;
    }

    if (this.guardrails.detectPromptInjection(content)) {
      await this.escalate(conversationId, 0, []);
      return;
    }

    const orderNumber = this.orderLookup.extractOrderNumber(content);
    let orderContext: string | null = null;
    if (orderNumber) {
      orderContext = await this.orderLookup.lookup(orderNumber, phoneDigits);
    }

    const chunks = await this.ragService.retrieve(content, 4);
    const retrievalScore = chunks[0]?.score ?? 0;
    const contextBlock = chunks.map((chunk) => chunk.content).join('\n---\n');

    const systemPrompt = [
      'Eres un asistente de soporte de una tienda en línea en Ecuador.',
      'Responde en español, de forma breve y útil.',
      'Si no tienes información suficiente, indica que un agente humano puede ayudar.',
      'Nunca inventes precios, stock ni políticas.',
      orderContext ? `Datos verificados del pedido: ${orderContext}` : '',
      contextBlock ? `Contexto:\n${contextBlock}` : '',
    ]
      .filter(Boolean)
      .join('\n\n');

    const messages = this.guardrails.sanitizeMessages([
      { role: 'system', content: systemPrompt },
      { role: 'user', content },
    ]);

    try {
      const completion = await this.llmProvider.complete(messages);
      const threshold = Number(this.config.get<string>('BOT_CONFIDENCE_THRESHOLD') ?? '0.7');
      const confidence =
        chunks.length > 0
          ? Math.min(completion.confidence, retrievalScore + 0.3)
          : completion.confidence;

      if (confidence < threshold) {
        await this.escalate(conversationId, confidence, chunks.map((chunk) => chunk.id), {
          promptHash: createHash('sha256').update(systemPrompt).digest('hex').slice(0, 16),
        });
        return;
      }

      await this.prisma.botInteraction.create({
        data: {
          conversationId,
          confidence,
          escalated: false,
          chunkIds: chunks.map((chunk) => chunk.id),
          promptHash: createHash('sha256').update(systemPrompt).digest('hex').slice(0, 16),
        },
      });

      await this.messageService.createBotOutbound(conversationId, completion.text);
    } catch (error) {
      this.logger.error({ error, conversationId }, 'Support bot failed');
      await this.escalate(conversationId, 0, []);
    }
  }

  private shouldEscalateByKeyword(text: string): boolean {
    return ESCALATION_KEYWORDS.some((keyword) => text.includes(keyword));
  }

  private async escalate(
    conversationId: string,
    confidence: number,
    chunkIds: string[],
    options?: { promptHash?: string },
  ): Promise<void> {
    await this.conversationService.update(conversationId, { status: 'PENDING' });
    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: { botEnabled: false },
    });

    await this.prisma.botInteraction.create({
      data: {
        conversationId,
        confidence,
        escalated: true,
        chunkIds,
        promptHash: options?.promptHash,
      },
    });
  }
}
