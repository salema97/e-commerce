import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';

@Injectable()
export class OrderLookupTool {
  constructor(private readonly prisma: PrismaService) {}

  async lookup(orderNumber: string, phoneDigits: string): Promise<string | null> {
    const normalizedOrder = orderNumber.trim().toUpperCase();
    const digits = phoneDigits.replace(/\D/g, '');

    const order = await this.prisma.order.findFirst({
      where: { orderNumber: normalizedOrder },
      select: {
        orderNumber: true,
        status: true,
        customerPhone: true,
        total: true,
      },
    });

    if (!order) {
      return null;
    }

    const orderPhone = (order.customerPhone ?? '').replace(/\D/g, '');
    if (!orderPhone || !digits || !orderPhone.endsWith(digits.slice(-9))) {
      return null;
    }

    return `Pedido ${order.orderNumber}: estado ${order.status}, total USD ${Number(order.total).toFixed(2)}.`;
  }

  extractOrderNumber(text: string): string | null {
    const match = text.match(/\bORD-[A-Z0-9-]+\b/i);
    return match?.[0]?.toUpperCase() ?? null;
  }
}
