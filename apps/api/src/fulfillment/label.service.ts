import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class LabelService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  async buildLabelUrl(shipmentId: string): Promise<string> {
    const base = this.config.get<string>('API_PUBLIC_URL') ?? 'http://localhost:3001';
    return `${base.replace(/\/$/, '')}/v1/fulfillment/shipments/${shipmentId}/label`;
  }

  async renderLabelHtml(shipmentId: string): Promise<string> {
    const shipment = await this.prisma.shipment.findUnique({
      where: { id: shipmentId },
      include: {
        order: true,
        items: { include: { orderItem: true } },
      },
    });
    if (!shipment) {
      throw new Error(`Shipment ${shipmentId} not found`);
    }

    const lines = shipment.items
      .map(
        (item) =>
          `<tr><td>${item.orderItem.sku}</td><td>${item.orderItem.name}</td><td>${item.quantity}</td></tr>`,
      )
      .join('');

    return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <title>Etiqueta ${shipment.id}</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 24px; }
    h1 { font-size: 20px; margin-bottom: 8px; }
    table { width: 100%; border-collapse: collapse; margin-top: 16px; }
    td, th { border: 1px solid #ccc; padding: 8px; text-align: left; }
    @media print { button { display: none; } }
  </style>
</head>
<body>
  <button onclick="window.print()">Imprimir</button>
  <h1>Etiqueta de envío</h1>
  <p><strong>Pedido:</strong> ${shipment.order.orderNumber}</p>
  <p><strong>Transportista:</strong> ${shipment.carrier}</p>
  <p><strong>Guía:</strong> ${shipment.trackingNumber ?? 'Pendiente'}</p>
  <table>
    <thead><tr><th>SKU</th><th>Producto</th><th>Cant.</th></tr></thead>
    <tbody>${lines}</tbody>
  </table>
</body>
</html>`;
  }
}
