import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Prisma, InvoiceStatus, ReturnStatus, CreditNoteStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { InvoiceProviderFactory } from './invoice-provider.factory.js';
import { IssueInvoiceDto } from './dto/issue-invoice.dto.js';
import { IssueCreditNoteDto } from './dto/issue-credit-note.dto.js';
import { InvoiceResponseDto } from './dto/invoice-response.dto.js';
import { CreditNoteResponseDto } from './dto/credit-note-response.dto.js';
import { InvoiceOrder, CreditNoteInput, CreditNoteItem } from './invoice-provider.interface.js';

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

  async issueCreditNote(
    dto: IssueCreditNoteDto,
    actorClerkUserId: string,
    skipStatusCheck = false,
  ): Promise<CreditNoteResponseDto> {
    const returnRequest = await this.prisma.returnRequest.findUnique({
      where: { id: dto.returnRequestId },
      include: { order: { include: { items: true, invoice: true } }, items: true },
    });

    if (!returnRequest) {
      throw new NotFoundException(
        `Return request ${dto.returnRequestId} not found`,
      );
    }

    if (!skipStatusCheck && returnRequest.status !== ReturnStatus.RESOLVED) {
      throw new BadRequestException(
        `Credit note can only be issued for resolved return requests`,
      );
    }

    const existing = await this.prisma.creditNote.findFirst({
      where: { returnRequest: { id: returnRequest.id } },
    });
    if (existing) {
      throw new BadRequestException(
        `Credit note already exists for return request ${returnRequest.id}`,
      );
    }

    const originalInvoice = returnRequest.order.invoice;
    if (!originalInvoice) {
      throw new BadRequestException(
        `No invoice found for order ${returnRequest.order.id}`,
      );
    }

    const creditNoteInput = this.buildCreditNoteInput(returnRequest, originalInvoice, dto.total);
    const provider = this.providerFactory.getProvider();
    const result = await provider.issueCreditNote(creditNoteInput);

    const creditNote = await this.prisma.creditNote.findUniqueOrThrow({
      where: { accessKey: result.accessKey },
    });

    this.logger.log(
      {
        creditNoteId: creditNote.id,
        accessKey: creditNote.accessKey,
        status: creditNote.status,
        actorClerkUserId,
      },
      'Credit note issued',
    );

    return this.mapCreditNoteToResponse(creditNote);
  }

  private buildCreditNoteInput(
    returnRequest: {
      id: string;
      reason: string;
      items: Array<{
        productId: string;
        productVariantId: string | null;
        quantity: number;
        refundValue: Prisma.Decimal | null;
      }>;
      order: {
        items: Array<{
          productId: string;
          variantId: string | null;
          name: string;
          sku: string;
          price: Prisma.Decimal;
        }>;
      };
    },
    originalInvoice: {
      accessKey: string;
      authorizationNumber: string | null;
      createdAt: Date;
    },
    totalOverride?: string,
  ): CreditNoteInput {
    const items: CreditNoteItem[] = returnRequest.items.map((item) => {
      const orderItem = returnRequest.order.items.find(
        (oi) =>
          oi.productId === item.productId &&
          oi.variantId === item.productVariantId,
      );
      const unitPrice = orderItem ? Number(orderItem.price) : 0;
      const refundValue = item.refundValue ? Number(item.refundValue) : unitPrice;
      return {
        code: orderItem?.sku ?? item.productId,
        description: orderItem?.name ?? item.productId,
        quantity: item.quantity,
        unitPrice,
        discount: 0,
        taxRate: 15,
        reason: returnRequest.reason,
      };
    });

    const total = totalOverride
      ? Number(totalOverride)
      : items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);

    return {
      returnRequestId: returnRequest.id,
      invoiceAccessKey: originalInvoice.accessKey,
      parentInvoiceAccessKey: originalInvoice.accessKey,
      authorizationNumber: originalInvoice.authorizationNumber ?? undefined,
      codDocModificado: '01',
      numDocModificado: originalInvoice.accessKey,
      fechaEmisionDocumentoModificado: this.formatDate(originalInvoice.createdAt),
      reason: returnRequest.reason,
      items,
      total,
    };
  }

  private formatDate(date: Date): string {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }

  private mapCreditNoteToResponse(creditNote: {
    id: string;
    accessKey: string;
    parentInvoiceAccessKey: string | null;
    authorizationNumber: string | null;
    status: CreditNoteStatus;
    xmlContent: string | null;
    totalAmount: Prisma.Decimal;
    createdAt: Date;
    updatedAt: Date;
  }): CreditNoteResponseDto {
    return {
      id: creditNote.id,
      accessKey: creditNote.accessKey,
      parentInvoiceAccessKey: creditNote.parentInvoiceAccessKey,
      authorizationNumber: creditNote.authorizationNumber,
      status: creditNote.status,
      xmlContent: creditNote.xmlContent,
      totalAmount: Number(creditNote.totalAmount),
      createdAt: creditNote.createdAt,
      updatedAt: creditNote.updatedAt,
    };
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
