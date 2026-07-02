import { Injectable } from '@nestjs/common';
import {
  ConfiguredEmbeddingProvider,
  ConfiguredLlmProvider,
} from './configured-ai.providers.js';
import { NativeSupportBotOrchestrator } from './orchestrator/native-support-bot.orchestrator.js';

@Injectable()
export class AiProviderWiring {
  constructor(
    private readonly llm: ConfiguredLlmProvider,
    private readonly embedding: ConfiguredEmbeddingProvider,
    private readonly orchestrator: NativeSupportBotOrchestrator,
  ) {}
}
