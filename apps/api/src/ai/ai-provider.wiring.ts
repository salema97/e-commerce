import { Injectable } from '@nestjs/common';
import {
  ConfiguredConversationOrchestrator,
  ConfiguredEmbeddingProvider,
  ConfiguredLlmProvider,
} from './configured-ai.providers.js';

@Injectable()
export class AiProviderWiring {
  constructor(
    private readonly llm: ConfiguredLlmProvider,
    private readonly embedding: ConfiguredEmbeddingProvider,
    private readonly orchestrator: ConfiguredConversationOrchestrator,
  ) {}
}
