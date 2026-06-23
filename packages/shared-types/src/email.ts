/**
 * Template identifiers for transactional emails.
 * Mirrors WhatsApp templates for omnichannel parity.
 */
export type EmailTemplate =
  | 'ORDER_CONFIRMED'
  | 'ORDER_SHIPPED'
  | 'ORDER_DELIVERED'
  | 'PAYMENT_FAILED'
  | 'REFUND_CONFIRMED'
  | 'SRI_DOCUMENT_DELIVERY';

export interface RenderedEmail {
  subject: string;
  html: string;
  text: string;
}
