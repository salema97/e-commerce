import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Queue } from 'bullmq';
import { PrismaModule } from '../prisma/prisma.module.js';
import { ConversationModule } from '../conversations/conversation.module.js';
import { MessageModule } from '../messages/message.module.js';
import { WhatsAppModule } from '../whatsapp/whatsapp.module.js';
import { LlmProvider } from './llm/llm-provider.interface.js';
import { LlmGuardrailsService } from './llm/llm-guardrails.service.js';
import { ConsoleLlmProvider } from './llm/providers/console-llm.provider.js';
import { OpenAiLlmProvider } from './llm/providers/openai-llm.provider.js';
import { AnthropicLlmProvider } from './llm/providers/anthropic-llm.provider.js';
import { EmbeddingProvider } from './embedding/embedding-provider.interface.js';
import { ConsoleEmbeddingProvider } from './embedding/providers/console-embedding.provider.js';
import { OpenAiEmbeddingProvider } from './embedding/providers/openai-embedding.provider.js';
import { KnowledgeIndexingService } from './knowledge/knowledge-indexing.service.js';
import { KnowledgeIndexQueueService } from './knowledge/knowledge-index-queue.service.js';
import { KnowledgeIndexQueueWorker } from './knowledge/knowledge-index-queue.worker.js';
import { KNOWLEDGE_INDEX_QUEUE_TOKEN } from './knowledge/knowledge-index-queue.tokens.js';
import {
  isKnowledgeIndexQueueEnabled,
  KNOWLEDGE_INDEX_QUEUE_NAME,
} from './knowledge/knowledge-index-queue.config.js';
import { FaqService } from './knowledge/faq.service.js';
import { CmsPageService } from './knowledge/cms-page.service.js';
import { FaqController } from './knowledge/faq.controller.js';
import { CmsPageController } from './knowledge/cms-page.controller.js';
import { RagService } from './rag/rag.service.js';
import { SupportBotService } from './support-bot/support-bot.service.js';
import { OrderLookupTool } from './support-bot/order-lookup.tool.js';
import { ConversationOrchestrator } from './orchestrator/conversation-orchestrator.interface.js';
import { NativeSupportBotOrchestrator } from './orchestrator/native-support-bot.orchestrator.js';
import { DifyOrchestrator } from './orchestrator/dify-orchestrator.js';
import { TypebotOrchestrator } from './orchestrator/typebot-orchestrator.js';
import { ChatService } from './chat/chat.service.js';
import { ChatController } from './chat/chat.controller.js';
import { MeilisearchService } from './search/meilisearch.service.js';
import { HybridSearchService } from './search/hybrid-search.service.js';
import { SearchController } from './search/search.controller.js';
import { SearchAdminController } from './search/search-admin.controller.js';
import { ProductContentAiService } from './product-content/product-content-ai.service.js';
import { ProductContentAiController } from './product-content/product-content-ai.controller.js';
import { ProductSearchSyncService } from './search/product-search-sync.service.js';
import { SearchDomainEventConsumer } from './search/search-domain-event.consumer.js';
import { SearchReindexService } from './search/search-reindex.service.js';

@Module({
  imports: [ConfigModule, PrismaModule, ConversationModule, MessageModule, WhatsAppModule],
  controllers: [
    FaqController,
    CmsPageController,
    ChatController,
    SearchController,
    SearchAdminController,
    ProductContentAiController,
  ],
  providers: [
    LlmGuardrailsService,
    ConsoleLlmProvider,
    OpenAiLlmProvider,
    AnthropicLlmProvider,
    {
      provide: LlmProvider,
      useFactory: (
        config: ConfigService,
        consoleProvider: ConsoleLlmProvider,
        openAiProvider: OpenAiLlmProvider,
        anthropicProvider: AnthropicLlmProvider,
      ) => {
        const selected = config.get<string>('LLM_PROVIDER', 'console');
        if (selected === 'openai') return openAiProvider;
        if (selected === 'anthropic') return anthropicProvider;
        return consoleProvider;
      },
      inject: [ConfigService, ConsoleLlmProvider, OpenAiLlmProvider, AnthropicLlmProvider],
    },
    ConsoleEmbeddingProvider,
    OpenAiEmbeddingProvider,
    {
      provide: EmbeddingProvider,
      useFactory: (
        config: ConfigService,
        consoleProvider: ConsoleEmbeddingProvider,
        openAiProvider: OpenAiEmbeddingProvider,
      ) => {
        const selected = config.get<string>('EMBEDDING_PROVIDER', 'console');
        return selected === 'openai' ? openAiProvider : consoleProvider;
      },
      inject: [ConfigService, ConsoleEmbeddingProvider, OpenAiEmbeddingProvider],
    },
    {
      provide: KNOWLEDGE_INDEX_QUEUE_TOKEN,
      useFactory: (config: ConfigService) => {
        const queue = new Queue(KNOWLEDGE_INDEX_QUEUE_NAME, {
          connection: { url: config.getOrThrow<string>('REDIS_URL') },
          defaultJobOptions: {
            attempts: 3,
            backoff: { type: 'exponential', delay: 1_000 },
            removeOnComplete: 100,
            removeOnFail: 50,
          },
        });

        queue.on('error', (error: Error) => {
          // eslint-disable-next-line no-console
          console.error('Knowledge index queue Redis error:', error.message);
        });

        if (isKnowledgeIndexQueueEnabled(config)) {
          void queue.waitUntilReady();
        }

        return queue;
      },
      inject: [ConfigService],
    },
    KnowledgeIndexingService,
    KnowledgeIndexQueueService,
    KnowledgeIndexQueueWorker,
    FaqService,
    CmsPageService,
    RagService,
    OrderLookupTool,
    SupportBotService,
    NativeSupportBotOrchestrator,
    DifyOrchestrator,
    TypebotOrchestrator,
    {
      provide: ConversationOrchestrator,
      useFactory: (
        config: ConfigService,
        native: NativeSupportBotOrchestrator,
        dify: DifyOrchestrator,
        typebot: TypebotOrchestrator,
      ) => {
        const selected = config.get<string>('CONVERSATION_ORCHESTRATOR', 'native');
        if (selected === 'dify') return dify;
        if (selected === 'typebot') return typebot;
        return native;
      },
      inject: [ConfigService, NativeSupportBotOrchestrator, DifyOrchestrator, TypebotOrchestrator],
    },
    ChatService,
    MeilisearchService,
    HybridSearchService,
    ProductSearchSyncService,
    SearchReindexService,
    ProductContentAiService,
    SearchDomainEventConsumer,
  ],
  exports: [
    LlmProvider,
    EmbeddingProvider,
    KnowledgeIndexingService,
    KnowledgeIndexQueueService,
    RagService,
    SupportBotService,
    ConversationOrchestrator,
    MeilisearchService,
    HybridSearchService,
    ProductSearchSyncService,
    SearchReindexService,
    ProductContentAiService,
  ],
})
export class AiModule {}
