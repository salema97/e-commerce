import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
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
import { FaqService } from './knowledge/faq.service.js';
import { CmsPageService } from './knowledge/cms-page.service.js';
import { FaqController } from './knowledge/faq.controller.js';
import { CmsPageController } from './knowledge/cms-page.controller.js';
import { RagService } from './rag/rag.service.js';
import { SupportBotService } from './support-bot/support-bot.service.js';
import { OrderLookupTool } from './support-bot/order-lookup.tool.js';
import { ChatService } from './chat/chat.service.js';
import { ChatController } from './chat/chat.controller.js';
import { MeilisearchService } from './search/meilisearch.service.js';
import { HybridSearchService } from './search/hybrid-search.service.js';
import { SearchController } from './search/search.controller.js';
import { ProductContentAiService } from './product-content/product-content-ai.service.js';
import { ProductContentAiController } from './product-content/product-content-ai.controller.js';
import { ProductSearchSyncService } from './search/product-search-sync.service.js';

@Module({
  imports: [ConfigModule, PrismaModule, ConversationModule, MessageModule, WhatsAppModule],
  controllers: [
    FaqController,
    CmsPageController,
    ChatController,
    SearchController,
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
    KnowledgeIndexingService,
    FaqService,
    CmsPageService,
    RagService,
    OrderLookupTool,
    SupportBotService,
    ChatService,
    MeilisearchService,
    HybridSearchService,
    ProductSearchSyncService,
    ProductContentAiService,
  ],
  exports: [
    LlmProvider,
    EmbeddingProvider,
    KnowledgeIndexingService,
    RagService,
    SupportBotService,
    MeilisearchService,
    HybridSearchService,
    ProductSearchSyncService,
    ProductContentAiService,
  ],
})
export class AiModule {}
