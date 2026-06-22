import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Prisma, InvoiceStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { InvoiceProviderFactory } from './invoice-provider.factory.js';
import { IssueInvoiceDto } from './dto/issue-invoice.dto.js';
import { InvoiceResponseDto } from './dto/invoice-response.dto.js';
import { InvoiceOrder } from './invoice-provider.interface.js';

@Injectable()
export class InvoicesService {
  private readonly logger = new Logger(InvoicesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly providerFactory: InvoiceProviderFactory,
  ) {}

  async issueInvoice(
    dto: IssueInvoiceDto,
    actorClerkUserId: string,
  ): Promise<InvoiceResponseDto> {
    const order = await this.prisma.order.findUnique({
      where: { id: dto.orderId },
      include: { items: true, payments: true },
    });

    if (!order) {
      throw new NotFoundException(`Order ${dto.orderId} not found`);
    }

    const existing = await this.prisma.invoice.findUnique({
      where: { orderId: order.id },
    });
    if (existing) {
      throw new BadRequestException(
        `Invoice already exists for order ${order.id}`,
      );
    }

    const invoiceOrder = this.mapOrderToInvoiceOrder(order);
    const provider = this.providerFactory.getProvider();
    const result = await provider.issueInvoice(invoiceOrder);

    const invoice = await this.prisma.invoice.create({
      data: {
        orderId: order.id,
        documentType: dto.documentType ?? '01',
        accessKey: result.accessKey,
        authorizationNumber: result.authorizationNumber ?? null,
        status: result.status,
        xmlContent: result.xmlContent ?? null,
        sriResponse: result.sriResponse
          ? (result.sriResponse as unknown as Prisma.InputJsonValue)
          : Prisma.JsonNull,
      },
    });

    this.logger.log(
      {
        invoiceId: invoice.id,
        accessKey: invoice.accessKey,
        status: invoice.status,
        actorClerkUserId,
      },
      'Invoice issued',
    );

    return this.mapToResponse(invoice);
  }

  async findByOrderId(orderId: string): Promise<InvoiceResponseDto | null> {
    const invoice = await this.prisma.invoice.findUnique({
      where: { orderId },
    });
    return invoice ? this.mapToResponse(invoice) : null;
  }

  async issueInvoiceForOrder(orderId: string): Promise<InvoiceResponseDto> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true, payments: true },
    });

    if (!order) {
      throw new NotFoundException(`Order ${orderId} not found`);
    }

    const existing = await this.prisma.invoice.findUnique({
      where: { orderId: order.id },
    });
    if (existing) {
      this.logger.log(`Invoice already exists for order ${order.id}; skipping auto-issue`);
      return this.mapToResponse(existing);
    }

    const invoiceOrder = this.mapOrderToInvoiceOrder(order);
    const provider = this.providerFactory.getProvider();
    const result = await provider.issueInvoice(invoiceOrder);

    const invoice = await this.prisma.invoice.create({
      data: {
        orderId: order.id,
        documentType: '01',
        accessKey: result.accessKey,
        authorizationNumber: result.authorizationNumber ?? null,
        status: result.status,
        xmlContent: result.xmlContent ?? null,
        sriResponse: result.sriResponse
          ? (result.sriResponse as unknown as Prisma.InputJsonValue)
          : Prisma.JsonNull,
      },
    });

    this.logger.log(
      {
        invoiceId: invoice.id,
        accessKey: invoice.accessKey,
        status: invoice.status,
        orderId: order.id,
      },
      'Invoice auto-issued for paid order',
    );

    return this.mapToResponse(invoice);
  }

  private mapOrderToInvoiceOrder(order: {
    id: string;
    orderNumber: string;
    customerEmail: string;
    customerPhone: string | null;
    subtotal: Prisma.Decimal;
    taxAmount: Prisma.Decimal;
    discountAmount: Prisma.Decimal;
    total: Prisma.Decimal;
    items: Array<{
      name: string;
      sku: string;
      price: Prisma.Decimal;
      quantity: number;
    }>;
  }): InvoiceOrder {
    return {
      orderId: order.id,
      orderNumber: order.orderNumber,
      customerName: order.customerEmail,
      customerEmail: order.customerEmail,
      customerPhone: order.customerPhone ?? undefined,
      subtotal: Number(order.subtotal),
      taxAmount: Number(order.taxAmount),
      discountAmount: Number(order.discountAmount),
      total: Number(order.total),
      currency: 'USD',
      items: order.items.map((item) => ({
        code: item.sku,
        description: item.name,
        quantity: item.quantity,
        unitPrice: Number(item.price),
        discount: 0,
        taxRate: 15,
      })),
    };
  }

  private mapToResponse(invoice: {
    id: string;
    orderId: string;
    documentType: string;
    accessKey: string;
    authorizationNumber: string | null;
    status: InvoiceStatus;
    xmlContent: string | null;
    pdfUrl: string | null;
    createdAt: Date;
    updatedAt: Date;
  }): InvoiceResponseDto {
    return {
      id: invoice.id,
      orderId: invoice.orderId,
      documentType: invoice.documentType,
      accessKey: invoice.accessKey,
      authorizationNumber: invoice.authorizationNumber,
      status: invoice.status,
      xmlContent: invoice.xmlContent,
      pdfUrl: invoice.pdfUrl,
      createdAt: invoice.createdAt,
      updatedAt: invoice.updatedAt,
    };
  }
}
