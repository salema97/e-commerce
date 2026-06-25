import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { Prisma, InvoiceStatus, ReturnStatus, CreditNoteStatus } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service.js';
import { InvoiceProviderFactory } from './invoice-provider.factory.js';
import { SriQueueService } from './sri/sri-queue.service.js';
import { SriDocumentStorageService } from './sri/sri-document-storage.service.js';
import { IssueInvoiceDto } from './dto/issue-invoice.dto.js';
import { IssueCreditNoteDto } from './dto/issue-credit-note.dto.js';
import { InvoiceResponseDto } from './dto/invoice-response.dto.js';
import { CreditNoteResponseDto } from './dto/credit-note-response.dto.js';
import { InvoiceOrder, CreditNoteInput, CreditNoteItem } from './invoice-provider.interface.js';
import { Role } from '../auth/role.enum.js';

export interface ListInvoicesFilter {
  orderId?: string;
  status?: InvoiceStatus;
  from?: Date;
  to?: Date;
  limit?: number;
  offset?: number;
}

export interface ListCreditNotesFilter {
  returnRequestId?: string;
  status?: CreditNoteStatus;
  from?: Date;
  to?: Date;
  limit?: number;
  offset?: number;
}

export interface InvoiceAccessContext {
  userId: string;
  role: Role;
}

@Injectable()
export class InvoicesService {
  private readonly logger = new Logger(InvoicesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly providerFactory: InvoiceProviderFactory,
    private readonly sriQueue: SriQueueService,
    private readonly documentStorage: SriDocumentStorageService,
  ) {}

  async issueInvoice(
    dto: IssueInvoiceDto,
    actorUserId: string,
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
        signedXml: result.xmlContent ?? null,
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
        actorUserId,
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
        signedXml: result.xmlContent ?? null,
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
    actorUserId: string,
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
        actorUserId,
      },
      'Credit note issued',
    );

    return this.mapCreditNoteToResponse(creditNote);
  }

  /**
   * Enqueue an SRI invoice job for a paid order. Used by webhooks so the
   * HTTP response is not blocked on SRI latency.
   */
  async enqueueInvoiceForOrder(orderId: string): Promise<void> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException(`Order ${orderId} not found`);
    }

    const existing = await this.prisma.invoice.findUnique({
      where: { orderId: order.id },
    });

    if (existing) {
      this.logger.log(
        { orderId, invoiceId: existing.id },
        'Invoice already exists for order; skipping enqueue',
      );
      return;
    }

    await this.sriQueue.addIssueInvoiceJob(orderId);
    this.logger.log({ orderId }, 'SRI invoice job enqueued for paid order');
  }

  /**
   * Create a PENDING credit note for a return request and enqueue an SRI
   * credit-note job. Used by refund/return flows so resolution is not blocked
   * on SRI latency.
   */
  async enqueueCreditNoteForReturn(
    returnRequestId: string,
    total: number,
  ): Promise<CreditNoteResponseDto> {
    const returnRequest = await this.prisma.returnRequest.findUnique({
      where: { id: returnRequestId },
      include: { order: { include: { invoice: true } }, items: true },
    });

    if (!returnRequest) {
      throw new NotFoundException(
        `Return request ${returnRequestId} not found`,
      );
    }

    const originalInvoice = returnRequest.order.invoice;
    if (!originalInvoice) {
      throw new BadRequestException(
        `No invoice found for order ${returnRequest.order.id}`,
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

    const creditNote = await this.prisma.creditNote.create({
      data: {
        accessKey: `PENDING-${randomUUID()}`,
        returnRequest: { connect: { id: returnRequest.id } },
        parentInvoiceAccessKey: originalInvoice.accessKey,
        totalAmount: new Prisma.Decimal(total),
        status: CreditNoteStatus.DRAFT,
      },
    });

    await this.sriQueue.addIssueCreditNoteJob(creditNote.id);

    this.logger.log(
      { creditNoteId: creditNote.id, returnRequestId },
      'SRI credit note job enqueued for return request',
    );

    return this.mapCreditNoteToResponse(creditNote);
  }

  async list(filter: ListInvoicesFilter = {}): Promise<InvoiceResponseDto[]> {
    const where: Prisma.InvoiceWhereInput = {};

    if (filter.orderId) where.orderId = filter.orderId;
    if (filter.status) where.status = filter.status;
    if (filter.from || filter.to) {
      where.createdAt = {};
      if (filter.from) where.createdAt.gte = filter.from;
      if (filter.to) where.createdAt.lte = filter.to;
    }

    const invoices = await this.prisma.invoice.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: filter.limit ?? 50,
      skip: filter.offset ?? 0,
    });

    return invoices.map((invoice) => this.mapToResponse(invoice));
  }

  async findById(id: string): Promise<
    InvoiceResponseDto & {
      order: {
        id: string;
        orderNumber: string;
        user: { id: string } | null;
      };
    }
  > {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id },
      include: {
        order: {
          select: {
            id: true,
            orderNumber: true,
            user: { select: { id: true } },
          },
        },
      },
    });

    if (!invoice) {
      throw new NotFoundException(`Invoice ${id} not found`);
    }

    return {
      ...this.mapToResponse(invoice),
      order: invoice.order,
    };
  }

  async retryIssue(id: string): Promise<InvoiceResponseDto> {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id },
    });

    if (!invoice) {
      throw new NotFoundException(`Invoice ${id} not found`);
    }

    const allowed: InvoiceStatus[] = [InvoiceStatus.FAILED, InvoiceStatus.REJECTED, InvoiceStatus.DRAFT, InvoiceStatus.PENDING];
    if (!allowed.includes(invoice.status)) {
      throw new BadRequestException(
        `Invoice ${id} cannot be retried from status ${invoice.status}`,
      );
    }

    await this.sriQueue.addIssueInvoiceJob(invoice.orderId);

    const updated = await this.prisma.invoice.update({
      where: { id },
      data: {
        status: InvoiceStatus.DRAFT,
        retryCount: 0,
        lastError: null,
      },
    });

    return this.mapToResponse(updated);
  }

  async getSignedXmlUrl(id: string): Promise<string> {
    const urls = await this.documentStorage.getInvoiceSignedUrls(id);
    return urls.xmlUrl;
  }

  async getSignedPdfUrl(id: string): Promise<string> {
    const urls = await this.documentStorage.getInvoiceSignedUrls(id);
    return urls.pdfUrl;
  }

  async listCreditNotes(
    filter: ListCreditNotesFilter = {},
  ): Promise<CreditNoteResponseDto[]> {
    const where: Prisma.CreditNoteWhereInput = {};

    if (filter.returnRequestId) {
      where.returnRequest = { id: filter.returnRequestId };
    }
    if (filter.status) where.status = filter.status;
    if (filter.from || filter.to) {
      where.createdAt = {};
      if (filter.from) where.createdAt.gte = filter.from;
      if (filter.to) where.createdAt.lte = filter.to;
    }

    const creditNotes = await this.prisma.creditNote.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: filter.limit ?? 50,
      skip: filter.offset ?? 0,
    });

    return creditNotes.map((cn) => this.mapCreditNoteToResponse(cn));
  }

  async findCreditNoteById(id: string): Promise<CreditNoteResponseDto> {
    const creditNote = await this.prisma.creditNote.findUnique({
      where: { id },
    });

    if (!creditNote) {
      throw new NotFoundException(`Credit note ${id} not found`);
    }

    return this.mapCreditNoteToResponse(creditNote);
  }

  async retryCreditNote(id: string): Promise<CreditNoteResponseDto> {
    const creditNote = await this.prisma.creditNote.findUnique({
      where: { id },
    });

    if (!creditNote) {
      throw new NotFoundException(`Credit note ${id} not found`);
    }

    const allowed: CreditNoteStatus[] = [CreditNoteStatus.FAILED, CreditNoteStatus.REJECTED, CreditNoteStatus.DRAFT, CreditNoteStatus.PENDING];
    if (!allowed.includes(creditNote.status)) {
      throw new BadRequestException(
        `Credit note ${id} cannot be retried from status ${creditNote.status}`,
      );
    }

    await this.sriQueue.addIssueCreditNoteJob(id);

    const updated = await this.prisma.creditNote.update({
      where: { id },
      data: {
        status: CreditNoteStatus.DRAFT,
        retryCount: 0,
        lastError: null,
      },
    });

    return this.mapCreditNoteToResponse(updated);
  }

  async getCreditNoteSignedXmlUrl(id: string): Promise<string> {
    const urls = await this.documentStorage.getCreditNoteSignedUrls(id);
    return urls.xmlUrl;
  }

  async getCreditNoteSignedPdfUrl(id: string): Promise<string> {
    const urls = await this.documentStorage.getCreditNoteSignedUrls(id);
    return urls.pdfUrl;
  }

  assertInvoiceAccess(
    invoice: {
      order: { user: { id: string } | null };
    },
    context: InvoiceAccessContext,
  ): void {
    const adminRoles = [Role.SUPER_ADMIN, Role.ADMIN, Role.FINANCE];
    if (adminRoles.includes(context.role)) {
      return;
    }

    const ownerId = invoice.order.user?.id;
    if (context.role === Role.CUSTOMER && ownerId === context.userId) {
      return;
    }

    throw new ForbiddenException('You do not have access to this invoice');
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
          taxRate: Prisma.Decimal | null;
          discountAmount: Prisma.Decimal | null;
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
        discount: Number(orderItem?.discountAmount ?? 0),
        taxRate: Number(orderItem?.taxRate ?? 15),
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
      totalAmount: Number(creditNote.totalAmount),
      createdAt: creditNote.createdAt,
      updatedAt: creditNote.updatedAt,
    };
  }

  private mapOrderToInvoiceOrder(order: {
    id: string;
    orderNumber: string;
    customerName: string | null;
    customerIdentification: string | null;
    customerEmail: string;
    customerPhone: string | null;
    customerAddress: string | null;
    subtotal: Prisma.Decimal;
    taxAmount: Prisma.Decimal;
    discountAmount: Prisma.Decimal;
    total: Prisma.Decimal;
    items: Array<{
      name: string;
      sku: string;
      price: Prisma.Decimal;
      quantity: number;
      taxRate: Prisma.Decimal | null;
      taxAmount: Prisma.Decimal | null;
      discountAmount: Prisma.Decimal | null;
    }>;
  }): InvoiceOrder {
    return {
      orderId: order.id,
      orderNumber: order.orderNumber,
      customerName: order.customerName ?? order.customerEmail,
      customerIdentification: order.customerIdentification ?? undefined,
      customerEmail: order.customerEmail,
      customerPhone: order.customerPhone ?? undefined,
      customerAddress: order.customerAddress ?? undefined,
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
        discount: Number(item.discountAmount ?? 0),
        taxRate: Number(item.taxRate ?? 15),
        taxAmount: Number(item.taxAmount ?? 0),
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
      createdAt: invoice.createdAt,
      updatedAt: invoice.updatedAt,
    };
  }
}
