import { Injectable } from '@nestjs/common';
import { LlmProvider } from '../llm-provider.interface.js';
import type { LlmCompletionOptions, LlmCompletionResult, LlmMessage } from '../llm.types.js';

@Injectable()
export class ConsoleLlmProvider extends LlmProvider {
  async complete(
    messages: LlmMessage[],
    _options?: LlmCompletionOptions,
  ): Promise<LlmCompletionResult> {
    const lastUser = [...messages].reverse().find((message) => message.role === 'user');
    const query = lastUser?.content ?? '';

    if (/agente|humano|persona/i.test(query)) {
      return {
        text: 'Te conecto con un agente humano en breve.',
        confidence: 0.2,
      };
    }

    if (/pedido|orden|ORD-/i.test(query)) {
      return {
        text: 'Puedo ayudarte con el estado de tu pedido. Comparte tu número de orden (ej. ORD-123) y verifico el estado.',
        confidence: 0.85,
      };
    }

    return {
      text: 'Gracias por escribirnos. Soy el asistente virtual de la tienda. ¿En qué puedo ayudarte hoy?',
      confidence: 0.75,
    };
  }
}
