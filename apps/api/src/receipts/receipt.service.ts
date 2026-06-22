import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

export interface ReceiptRecord {
  id: string;
  orderId: string;
  number: string;
  url: string | null;
  emailDelivered: boolean;
  createdAt: Date;
}

@Injectable()
export class ReceiptService {
  private readonly logger = new Logger(ReceiptService.name);

  constructor(private readonly prisma: PrismaService) {}

  async generateReceipt(orderId: string): Promise<ReceiptRecord> {
    const existing = await this.prisma.receipt.findUnique({
      where: { orderId },
    });
    if (existing) {
      return this.toRecord(existing, false);
    }

    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException(`Order ${orderId} not found`);
    }

    // PDF URL placeholder: real PDF generation will be wired in Phase 7 (RIDE) / Phase 8.
    const number = this.generateReceiptNumber(order.orderNumber);
    const url = `receipts://${orderId}/${number}.pdf`;

    const receipt = await this.prisma.receipt.create({
      data: {
        orderId: order.id,
        number,
        url,
      },
    });

    // Email delivery placeholder: Resend/Loops wiring lands in Phase 9.
    let emailDelivered = false;
    try {
      if (order.customerEmail) {
        this.logger.log(
          { orderId, email: order.customerEmail, receiptNumber: number },
          'Receipt email queued (placeholder)',
        );
        emailDelivered = true;
      }
    } catch (error) {
      this.logger.warn({ error, orderId }, 'Failed to queue receipt email');
    }

    return this.toRecord(receipt, emailDelivered);
  }

  async getReceipt(orderId: string): Promise<ReceiptRecord> {
    const receipt = await this.prisma.receipt.findUnique({
      where: { orderId },
    });
    if (!receipt) {
      throw new BadRequestException(`Receipt not generated for order ${orderId}`);
    }
    return this.toRecord(receipt, false);
  }

  private generateReceiptNumber(orderNumber: string): string {
    const stamp = Date.now().toString(36).toUpperCase();
    return `RCP-${orderNumber}-${stamp}`;
  }

  private toRecord(
    receipt: {
      id: string;
      orderId: string;
      number: string;
      url: string | null;
      createdAt: Date;
    },
    emailDelivered: boolean,
  ): ReceiptRecord {
    return {
      id: receipt.id,
      orderId: receipt.orderId,
      number: receipt.number,
      url: receipt.url,
      emailDelivered,
      createdAt: receipt.createdAt,
    };
  }
}
