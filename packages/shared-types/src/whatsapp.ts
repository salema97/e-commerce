import type { MessageStatus } from './enums.js';

/**
 * Template identifiers for transactional WhatsApp messages.
 * These are string literals so the package remains runtime-free.
 */
export type WhatsAppTemplate =
  | 'ORDER_CONFIRMED'
  | 'ORDER_SHIPPED'
  | 'ORDER_DELIVERED'
  | 'PICKUP_READY'
  | 'PAYMENT_FAILED'
  | 'REFUND_CONFIRMED'
  | 'RETURN_REQUESTED'
  | 'RETURN_STATUS_CHANGED'
  | 'RETURN_STORE_CREDIT'
  | 'SRI_DOCUMENT_DELIVERY';

/**
 * Result returned by a WhatsApp provider after sending a message.
 */
export interface SendWhatsAppResult {
  providerMessageId: string;
  status: MessageStatus;
}

/**
 * Parameters for sending a plain-text WhatsApp message.
 */
export interface SendWhatsAppTextOptions {
  phone: string;
  text: string;
}

/**
 * Parameters for sending a templated WhatsApp message.
 */
export interface SendWhatsAppTemplateOptions {
  phone: string;
  template: WhatsAppTemplate;
  variables: Record<string, string>;
}
