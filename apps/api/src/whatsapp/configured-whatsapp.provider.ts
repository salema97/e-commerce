import { Injectable } from '@nestjs/common';
import type { SendWhatsAppResult, WhatsAppTemplate } from '@repo/shared-types';
import { WhatsAppProvider } from './whatsapp-provider.interface.js';
import { EvolutionApiProvider } from './providers/evolution-api.provider.js';

@Injectable()
export class ConfiguredWhatsAppProvider extends WhatsAppProvider {
  constructor(private readonly evolutionProvider: EvolutionApiProvider) {
    super();
  }

  sendText(phone: string, text: string): Promise<SendWhatsAppResult> {
    return this.evolutionProvider.sendText(phone, text);
  }

  sendTemplate(
    phone: string,
    template: WhatsAppTemplate,
    variables: Record<string, string>,
  ): Promise<SendWhatsAppResult> {
    return this.evolutionProvider.sendTemplate!(phone, template, variables);
  }

  verifyWebhookSignature(payload: unknown, signature: string): boolean {
    return this.evolutionProvider.verifyWebhookSignature(payload, signature);
  }
}
