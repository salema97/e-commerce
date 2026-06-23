import { Injectable, NotFoundException } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import { PrismaService } from '../prisma/prisma.service.js';

export interface OrderSummaryPdfAttachment {
  filename: string;
  content: Buffer;
  contentType: string;
}

@Injectable()
export class OrderSummaryPdfService {
  constructor(private readonly prisma: PrismaService) {}

  async generateBuffer(orderId: string): Promise<Buffer> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    if (!order) {
      throw new NotFoundException(`Order ${orderId} not found`);
    }

    return new Promise((resolve, reject) => {
      const pdf = new PDFDocument({ margin: 40, size: 'A4' });
      const buffers: Buffer[] = [];

      pdf.on('data', (chunk) => buffers.push(chunk));
      pdf.on('end', () => resolve(Buffer.concat(buffers)));
      pdf.on('error', reject);

      pdf.fontSize(18).text('Confirmación de pedido', { align: 'center' });
      pdf.moveDown();
      pdf.fontSize(11);
      pdf.text(`Pedido: ${order.orderNumber}`);
      pdf.text(`Cliente: ${order.customerName ?? order.customerEmail}`);
      pdf.text(`Fecha: ${order.createdAt.toISOString().slice(0, 10)}`);
      pdf.moveDown();
      pdf.text('Artículos:', { underline: true });
      pdf.moveDown(0.5);

      for (const item of order.items) {
        pdf.text(
          `${item.quantity}x ${item.name} (${item.sku}) — USD ${Number(item.price).toFixed(2)}`,
        );
      }

      pdf.moveDown();
      pdf.text(`Subtotal: USD ${Number(order.subtotal).toFixed(2)}`);
      pdf.text(`Impuestos: USD ${Number(order.taxAmount).toFixed(2)}`);
      pdf.text(`Envío: USD ${Number(order.shippingAmount).toFixed(2)}`);
      if (Number(order.discountAmount) > 0) {
        pdf.text(`Descuento: -USD ${Number(order.discountAmount).toFixed(2)}`);
      }
      pdf.fontSize(13).text(`Total: USD ${Number(order.total).toFixed(2)}`, { underline: true });
      pdf.fontSize(9).moveDown(2).text(
        'Este documento es un resumen de compra. La factura electrónica SRI se enviará por separado cuando esté autorizada.',
        { align: 'center' },
      );

      pdf.end();
    });
  }

  async buildEmailAttachment(orderId: string, orderNumber: string): Promise<OrderSummaryPdfAttachment | undefined> {
    try {
      const content = await this.generateBuffer(orderId);
      return {
        filename: `pedido-${orderNumber}.pdf`,
        content,
        contentType: 'application/pdf',
      };
    } catch {
      return undefined;
    }
  }
}
