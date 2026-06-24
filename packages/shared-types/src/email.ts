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
  | 'SRI_DOCUMENT_DELIVERY'
  | 'ABANDONED_CART'
  | 'BACK_IN_STOCK'
  | 'WIN_BACK'
  | 'PROMO_CODE';

export interface RenderedEmail {
  subject: string;
  html: string;
  text: string;
}
