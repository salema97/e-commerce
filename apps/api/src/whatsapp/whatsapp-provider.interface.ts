import type { SendWhatsAppResult, WhatsAppTemplate } from '@repo/shared-types';
import { WhatsAppProviderError } from './whatsapp-provider.error.js';

/**
 * Port abstraction for WhatsApp transport providers.
 *
 * Core code depends on this port, not on any specific provider (Evolution API,
 * Baileys, WhatsApp Cloud API, etc.). The concrete adapter is selected in
 * {@link WhatsAppModule}.
 */
export abstract class WhatsAppProvider {
  /**
   * Send a plain-text message to the given phone number.
   */
  abstract sendText(phone: string, text: string): Promise<SendWhatsAppResult>;

  /**
   * Send a templated message. Optional because some providers or use cases
   * may only need plain-text support.
   */
  abstract sendTemplate?(
    phone: string,
    template: WhatsAppTemplate,
    variables: Record<string, string>,
  ): Promise<SendWhatsAppResult>;

  /**
   * Verify that a webhook payload was signed by the provider.
   *
   * @param payload Raw request body (usually a Buffer or string).
   * @param signature Value from the provider signature header.
   * @returns true when the signature is valid.
   */
  abstract verifyWebhookSignature(payload: unknown, signature: string): boolean;
}

export { WhatsAppProviderError };
