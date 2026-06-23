import type { WhatsAppTemplate } from '@repo/shared-types';

export interface OrderConfirmedContext {
  customerName: string;
  orderNumber: string;
  total: string;
}

export interface OrderShippedContext {
  customerName: string;
  orderNumber: string;
  carrier: string;
  trackingNumber: string;
  trackingUrl?: string;
}

export interface OrderDeliveredContext {
  customerName: string;
  orderNumber: string;
}

export interface PaymentFailedContext {
  customerName: string;
  orderNumber: string;
  total: string;
  retryUrl?: string;
}

export interface RefundConfirmedContext {
  customerName: string;
  orderNumber: string;
  amount: string;
  refundMethod: string;
}

export interface SriDocumentDeliveryContext {
  customerName: string;
  documentTypeLabel: string;
  accessKey: string;
  pdfUrl: string;
  xmlUrl: string;
}

export type NotificationContext =
  | OrderConfirmedContext
  | OrderShippedContext
  | OrderDeliveredContext
  | PaymentFailedContext
  | RefundConfirmedContext
  | SriDocumentDeliveryContext;

/**
 * Render a transactional WhatsApp template into plain Spanish text.
 *
 * No HTML is emitted — only plain text suitable for WhatsApp messaging.
 */
export function renderWhatsAppTemplate(
  template: WhatsAppTemplate,
  context: NotificationContext,
): string {
  switch (template) {
    case 'ORDER_CONFIRMED':
      return orderConfirmed(context as OrderConfirmedContext);
    case 'ORDER_SHIPPED':
      return orderShipped(context as OrderShippedContext);
    case 'ORDER_DELIVERED':
      return orderDelivered(context as OrderDeliveredContext);
    case 'PAYMENT_FAILED':
      return paymentFailed(context as PaymentFailedContext);
    case 'REFUND_CONFIRMED':
      return refundConfirmed(context as RefundConfirmedContext);
    case 'SRI_DOCUMENT_DELIVERY':
      return sriDocumentDelivery(context as SriDocumentDeliveryContext);
    default:
      throw new Error(`Unsupported WhatsApp template: ${template}`);
  }
}

function orderConfirmed(ctx: OrderConfirmedContext): string {
  return (
    `Hola ${ctx.customerName}, tu pedido *${ctx.orderNumber}* ha sido confirmado.\n\n` +
    `Total: ${ctx.total}\n` +
    `Gracias por tu compra. Te avisaremos cuando sea enviado.`
  );
}

function orderShipped(ctx: OrderShippedContext): string {
  const trackingLine = ctx.trackingUrl
    ? `Seguimiento: ${ctx.trackingUrl}`
    : `Numero de seguimiento: ${ctx.trackingNumber}`;

  return (
    `Hola ${ctx.customerName}, tu pedido *${ctx.orderNumber}* ha sido enviado.\n\n` +
    `Transportista: ${ctx.carrier}\n` +
    `${trackingLine}\n\n` +
    `Puedes responder a este chat si tienes alguna pregunta.`
  );
}

function orderDelivered(ctx: OrderDeliveredContext): string {
  return (
    `Hola ${ctx.customerName}, tu pedido *${ctx.orderNumber}* ha sido entregado.\n\n` +
    `Esperamos que disfrutes tu compra. Si necesitas ayuda, responde a este mensaje.`
  );
}

function paymentFailed(ctx: PaymentFailedContext): string {
  const retryLine = ctx.retryUrl
    ? `Intenta nuevamente aqui: ${ctx.retryUrl}`
    : `Intenta completar el pago nuevamente desde tu cuenta.`;

  return (
    `Hola ${ctx.customerName}, no pudimos procesar el pago de tu pedido *${ctx.orderNumber}*.\n\n` +
    `Total: ${ctx.total}\n` +
    `${retryLine}\n\n` +
    `Si el problema persiste, contacta a nuestro equipo de soporte.`
  );
}

function refundConfirmed(ctx: RefundConfirmedContext): string {
  return (
    `Hola ${ctx.customerName}, tu reembolso para el pedido *${ctx.orderNumber}* ha sido procesado.\n\n` +
    `Monto: ${ctx.amount}\n` +
    `Metodo: ${ctx.refundMethod}\n\n` +
    `El reembolso se reflejara en los proximos dias habiles segun tu banco o metodo de pago.`
  );
}

function sriDocumentDelivery(ctx: SriDocumentDeliveryContext): string {
  return (
    `Hola ${ctx.customerName}, tu ${ctx.documentTypeLabel} ha sido autorizada por el SRI.\n\n` +
    `Clave de acceso: ${ctx.accessKey}\n` +
    `PDF: ${ctx.pdfUrl}\n` +
    `XML: ${ctx.xmlUrl}\n\n` +
    `Guarda estos documentos para tus registros.`
  );
}
