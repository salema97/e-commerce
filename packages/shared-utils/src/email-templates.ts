import type { EmailTemplate } from '@repo/shared-types';

export interface OrderConfirmedEmailContext {
  customerName: string;
  orderNumber: string;
  total: string;
}

export interface OrderShippedEmailContext {
  customerName: string;
  orderNumber: string;
  carrier: string;
  trackingNumber: string;
  trackingUrl?: string;
}

export interface OrderDeliveredEmailContext {
  customerName: string;
  orderNumber: string;
}

export interface PaymentFailedEmailContext {
  customerName: string;
  orderNumber: string;
  total: string;
  retryUrl?: string;
}

export interface RefundConfirmedEmailContext {
  customerName: string;
  orderNumber: string;
  amount: string;
  refundMethod: string;
}

export interface SriDocumentDeliveryEmailContext {
  customerName: string;
  documentTypeLabel: string;
  accessKey: string;
  pdfUrl: string;
  xmlUrl: string;
  orderNumber?: string;
}

export type EmailTemplateContext =
  | OrderConfirmedEmailContext
  | OrderShippedEmailContext
  | OrderDeliveredEmailContext
  | PaymentFailedEmailContext
  | RefundConfirmedEmailContext
  | SriDocumentDeliveryEmailContext;

export function renderEmailTemplate(
  template: EmailTemplate,
  context: EmailTemplateContext,
): { subject: string; html: string; text: string } {
  switch (template) {
    case 'ORDER_CONFIRMED':
      return orderConfirmed(context as OrderConfirmedEmailContext);
    case 'ORDER_SHIPPED':
      return orderShipped(context as OrderShippedEmailContext);
    case 'ORDER_DELIVERED':
      return orderDelivered(context as OrderDeliveredEmailContext);
    case 'PAYMENT_FAILED':
      return paymentFailed(context as PaymentFailedEmailContext);
    case 'REFUND_CONFIRMED':
      return refundConfirmed(context as RefundConfirmedEmailContext);
    case 'SRI_DOCUMENT_DELIVERY':
      return sriDocumentDelivery(context as SriDocumentDeliveryEmailContext);
    default:
      throw new Error(`Unsupported email template: ${template satisfies never}`);
  }
}

function orderConfirmed(ctx: OrderConfirmedEmailContext) {
  const subject = `Pedido ${ctx.orderNumber} confirmado`;
  const text =
    `Hola ${ctx.customerName},\n\n` +
    `Tu pedido ${ctx.orderNumber} ha sido confirmado.\n` +
    `Total: ${ctx.total}\n\n` +
    `Gracias por tu compra.`;
  return { subject, text, html: paragraph(text) };
}

function orderShipped(ctx: OrderShippedEmailContext) {
  const tracking = ctx.trackingUrl
    ? `Seguimiento: ${ctx.trackingUrl}`
    : `Número de seguimiento: ${ctx.trackingNumber}`;
  const subject = `Tu pedido ${ctx.orderNumber} fue enviado`;
  const text =
    `Hola ${ctx.customerName},\n\n` +
    `Tu pedido ${ctx.orderNumber} ha sido enviado.\n` +
    `Transportista: ${ctx.carrier}\n` +
    `${tracking}`;
  return { subject, text, html: paragraph(text) };
}

function orderDelivered(ctx: OrderDeliveredEmailContext) {
  const subject = `Pedido ${ctx.orderNumber} entregado`;
  const text =
    `Hola ${ctx.customerName},\n\n` +
    `Tu pedido ${ctx.orderNumber} ha sido entregado. ¡Esperamos que disfrutes tu compra!`;
  return { subject, text, html: paragraph(text) };
}

function paymentFailed(ctx: PaymentFailedEmailContext) {
  const retry = ctx.retryUrl
    ? `Intenta nuevamente: ${ctx.retryUrl}`
    : 'Intenta completar el pago desde tu cuenta.';
  const subject = `Pago fallido — pedido ${ctx.orderNumber}`;
  const text =
    `Hola ${ctx.customerName},\n\n` +
    `No pudimos procesar el pago de tu pedido ${ctx.orderNumber}.\n` +
    `Total: ${ctx.total}\n` +
    `${retry}`;
  return { subject, text, html: paragraph(text) };
}

function refundConfirmed(ctx: RefundConfirmedEmailContext) {
  const subject = `Reembolso procesado — pedido ${ctx.orderNumber}`;
  const text =
    `Hola ${ctx.customerName},\n\n` +
    `Tu reembolso del pedido ${ctx.orderNumber} fue procesado.\n` +
    `Monto: ${ctx.amount}\n` +
    `Método: ${ctx.refundMethod}`;
  return { subject, text, html: paragraph(text) };
}

function sriDocumentDelivery(ctx: SriDocumentDeliveryEmailContext) {
  const subject = `Tu ${ctx.documentTypeLabel} SRI está disponible`;
  const text =
    `Hola ${ctx.customerName},\n\n` +
    `Tu ${ctx.documentTypeLabel} fue autorizada por el SRI.\n` +
    `Clave de acceso: ${ctx.accessKey}\n` +
    `PDF: ${ctx.pdfUrl}\n` +
    `XML: ${ctx.xmlUrl}`;
  return { subject, text, html: paragraph(text) };
}

function paragraph(text: string): string {
  return text
    .split('\n')
    .map((line) => `<p>${escapeHtml(line)}</p>`)
    .join('');
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}
